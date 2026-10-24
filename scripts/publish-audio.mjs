// Encodes every take that passed (data/clips.json, from generate-audio.mjs) for the app: public/audio/<voice>/<id>.mp3,
// trimmed and levelled exactly as it was checked, and src/content/audio.json, which voices each clip has. Clips that no
// longer pass are removed. Reads data/ only, so it can run while a generation is still going.
//   node scripts/publish-audio.mjs
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { Mp3Encoder } from "@breezystack/lamejs";
import { readWav, tidy } from "./lib/wav.mjs";

const KBPS = 48;
const RAW = "scripts/work/raw";
const { voices, clips } = JSON.parse(readFileSync("data/clips.json", "utf8"));

const have = {};
let written = 0;
let kept = 0;
let removed = 0;
for (const voice of voices) {
  const dir = `public/audio/${voice.id}`;
  mkdirSync(dir, { recursive: true });
  const keep = new Set();
  for (const [key, c] of Object.entries(clips)) {
    const [v, id] = key.split("/");
    if (v !== voice.id || c.status !== "pass") continue;
    const raw = `${RAW}/${v}/${id}.${c.attempt}.wav`;
    const out = `${dir}/${id}.mp3`;
    keep.add(`${id}.mp3`);
    (have[id] ??= []).push(voice.id);
    // Already encoded from this take: leave it (a new take of the same text gets a new attempt number in clips.json).
    if (existsSync(out) && c.publishedAttempt === c.attempt) {
      kept++;
      continue;
    }
    if (!existsSync(raw)) continue;
    const { rate, samples } = readWav(readFileSync(raw));
    const clean = tidy(samples, rate);
    const pcm = new Int16Array(clean.length);
    for (let i = 0; i < clean.length; i++) pcm[i] = Math.round(Math.max(-1, Math.min(1, clean[i])) * 32767);
    const enc = new Mp3Encoder(1, rate, KBPS);
    writeFileSync(out, Buffer.concat([Buffer.from(enc.encodeBuffer(pcm)), Buffer.from(enc.flush())]));
    c.publishedAttempt = c.attempt;
    written++;
  }
  for (const f of readdirSync(dir)) {
    if (!keep.has(f)) {
      rmSync(`${dir}/${f}`);
      removed++;
    }
  }
}
writeFileSync("data/clips.json", JSON.stringify({ voices, clips }, null, 1) + "\n");
const sorted = Object.fromEntries(Object.entries(have).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync("src/content/audio.json", JSON.stringify({ voices: voices.map((v) => v.id), have: sorted }) + "\n");
console.log(`wrote ${written}, kept ${kept}, removed ${removed}; ${Object.keys(sorted).length} texts have a clip`);
