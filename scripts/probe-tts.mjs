// Before generating everything: can Gemini TTS say one short Korean word on its own, without reading the instruction
// aloud, and does a recognizer hear what it said? The shortest items, two voices, three ways of asking. A one-syllable
// clip much longer than a second means the instruction was read.
//   node --env-file=../作品,app/chinese/.env.local scripts/probe-tts.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { synthesize, transcribe, withRetry } from "./lib/services.mjs";
import { readWav, tidy } from "./lib/wav.mjs";

const VOICES = ["Kore", "Charon"];
const PROMPTS = {
  ko: (w) => `다음 한국어를 표준어로, 또박또박 자연스럽게 한 번만 읽어 주세요:\n${w}`,
  en: (w) => `Say this Korean word once, clearly and naturally, in standard Seoul Korean:\n${w}`,
  bare: (w) => w,
};
const ITEMS = ["가", "어", "오", "으", "김", "커피"];
const DIR = "scripts/work/probe";

const jobs = [];
for (const p of Object.keys(PROMPTS)) for (const v of VOICES) for (const t of ITEMS) jobs.push({ p, v, t });

let next = 0;
async function worker() {
  while (next < jobs.length) {
    const j = jobs[next++];
    const dir = `${DIR}/${j.p}/${j.v}`;
    const file = `${dir}/${j.t}.wav`;
    if (existsSync(file)) continue;
    mkdirSync(dir, { recursive: true });
    writeFileSync(file, await withRetry(() => synthesize(PROMPTS[j.p](j.t), j.v)));
    process.stdout.write(".");
  }
}
await Promise.all([worker(), worker()]);
console.log("\nprompt voice item  raw  tidy  heard");
for (const j of jobs) {
  const raw = readFileSync(`${DIR}/${j.p}/${j.v}/${j.t}.wav`);
  const { rate, samples } = readWav(raw);
  const clean = tidy(samples, rate);
  const heard = await withRetry(() => transcribe(raw));
  console.log(
    `${j.p.padEnd(5)} ${j.v.padEnd(6)} ${j.t.padEnd(3)} ${(samples.length / rate).toFixed(2).padStart(5)} ${(clean.length / rate).toFixed(2).padStart(5)}  ${heard}`,
  );
}
