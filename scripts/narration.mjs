// The narration of 最初の16字 (src/content/narration.json): made by the promotional film's generator (Gemini TTS on
// Vertex, voice Kore, trimmed and checked the same way: promo/scripts/voice.mjs), raw takes in scripts/work/narration
// (not committed), lengths in src/content/narration-lengths.json; then each encoded for the app as
// public/narration/<id>.mp3. Resumable: lines already made are left (--force with --only to make one again).
//   node scripts/narration.mjs --env ../english/.env.local [--only g-1,g-2] [--force] [--check]
//   node scripts/narration.mjs --publish        only encode what is there
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Mp3Encoder } from "@breezystack/lamejs";
import { readWav } from "./lib/wav.mjs";

const KBPS = 48;
const SPEC = resolve("src/content/narration.json");
const RAW = resolve("scripts/work/narration");
const LENGTHS = resolve("src/content/narration-lengths.json");
const OUT = "public/narration";
const args = process.argv.slice(2);

if (!args.includes("--publish")) {
  // The generator runs in promo/: the .env path made absolute.
  const pass = [...args];
  const env = args.indexOf("--env");
  if (env >= 0) pass[env + 1] = resolve(args[env + 1]);
  mkdirSync(RAW, { recursive: true });
  const r = spawnSync(process.execPath, ["scripts/voice.mjs", "--spec", SPEC, "--out", RAW, "--lengths", LENGTHS, ...pass], {
    cwd: "promo",
    stdio: "inherit",
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
  if (args.includes("--check")) process.exit(0);
}

mkdirSync(OUT, { recursive: true });
let n = 0;
for (const { id } of JSON.parse(readFileSync(SPEC, "utf8")).lines) {
  const raw = `${RAW}/${id}.wav`;
  if (!existsSync(raw)) continue;
  const { rate, samples } = readWav(readFileSync(raw));
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) pcm[i] = Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767);
  const enc = new Mp3Encoder(1, rate, KBPS);
  writeFileSync(`${OUT}/${id}.mp3`, Buffer.concat([Buffer.from(enc.encodeBuffer(pcm)), Buffer.from(enc.flush())]));
  n++;
}
console.log(`  public/narration：${n}本`);
