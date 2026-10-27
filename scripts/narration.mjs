// The narration of 最初の16字 (src/content/narration.json): made by the promotional film's generator (Gemini TTS on
// Vertex, voice Kore, trimmed and checked the same way: promo/scripts/voice.mjs), raw takes in scripts/work/narration
// (not committed), lengths in src/content/narration-lengths.json; then each encoded for the app as
// public/narration/<id>.mp3, sped up by TEMPO (the voice comes slower than wanted; ffmpeg's atempo keeps the pitch,
// the lengths are the sped-up ones). Resumable: lines already made are left (--force with --only to make one again).
//   node scripts/narration.mjs --env ../english/.env.local [--only g-1,g-2] [--force] [--check]
//   node scripts/narration.mjs --publish        only encode what is there
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { Mp3Encoder } from "@breezystack/lamejs";
import { readWav } from "./lib/wav.mjs";

const KBPS = 48;
const TEMPO = 1; // atempo made the voice sound wrong: the speed is set by the instruction (narration.json style)
const FFMPEG = resolve("promo/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe");
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
const lengths = {};
const tmp = resolve(tmpdir(), "hangul-narration.wav");
for (const { id } of JSON.parse(readFileSync(SPEC, "utf8")).lines) {
  const raw = `${RAW}/${id}.wav`;
  if (!existsSync(raw)) continue;
  const f = spawnSync(FFMPEG, ["-y", "-loglevel", "error", "-i", raw, "-filter:a", `atempo=${TEMPO}`, "-c:a", "pcm_s16le", tmp]);
  if (f.status !== 0) throw new Error(`ffmpeg: ${id}: ${f.stderr}`);
  const { rate, samples } = readWav(readFileSync(tmp));
  lengths[id] = Math.round((samples.length / rate) * 100) / 100;
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) pcm[i] = Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767);
  const enc = new Mp3Encoder(1, rate, KBPS);
  writeFileSync(`${OUT}/${id}.mp3`, Buffer.concat([Buffer.from(enc.encodeBuffer(pcm)), Buffer.from(enc.flush())]));
}
rmSync(tmp, { force: true });
writeFileSync(LENGTHS, `${JSON.stringify(lengths, null, 1)}
`);
console.log(`  public/narration：${Object.keys(lengths).length}本（×${TEMPO}）`);
