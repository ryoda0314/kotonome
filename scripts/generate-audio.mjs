// Makes and checks a clip for every text in src/content/clips.ts, in each voice (CONCEPT.md: AI は作るときだけ).
//
// A take is used only if it is as long as its syllables allow (Gemini sometimes says something else at length: 영어
// came back as a whole made-up sentence) and a recognizer agrees it says the text:
//   - a word: gpt-4o-transcribe hears it (spaces, punctuation and numbers in digits aside). If not, it is asked again
//     with the text and its rivals named (the words one letter away in pairs.ts, and the syllables one letter away),
//     in both orders, by two models: all four answers must be the text for a word with a partner in pairs.ts (a wrong
//     take there would teach the wrong difference), three of four for any other.
//   - one syllable on its own: recognizers guess a lone syllable badly (가 heard as 바 or 카, 어 as 오), so it is
//     always asked with its rivals named, both orders, both models, and three of the four must agree. Probing showed
//     this catches real failures (a take every model heard as 바) without failing good ones (코 heard 코 코 코 쿠).
// ㅐ and ㅔ (and ㅒ ㅖ, ㅙ ㅞ ㅚ) are said alike now; either is accepted. A word with `say` (밖 said ［박］) is right
// when heard as either.
// A failing take is made again, up to TRIES; then it waits in data/review.json for a person to listen.
// Raw takes stay in scripts/work/raw (not committed): the same command resumes anywhere.
// scripts/publish-audio.mjs then encodes the passing takes for the app.
//
//   node --env-file=../作品,app/chinese/.env.local scripts/generate-audio.mjs [--voices=kore] [--limit=20] [--no-generate]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { clipId, compose, decompose, isSyllable } from "../src/lib/hangul.ts";
import { CLIP_TEXTS, VOICES } from "../src/content/clips.ts";
import { PAIRS } from "../src/content/pairs.ts";
import { WORD } from "../src/content/words.ts";
import { synthesize, transcribe, withRetry } from "./lib/services.mjs";
import { readWav, tidy } from "./lib/wav.mjs";

const TRIES = 6;
const RAW = "scripts/work/raw";
const MODELS = ["gpt-4o-transcribe", "gpt-4o-mini-transcribe"];
// A bare text read most cleanly in probing (scripts/probe-tts.mjs): an instruction in Korean made one 가 come out as 바.
// But a word naming a language, given bare, can switch the voice into it (영어 came back in English), so the later
// takes of a text that keeps failing are asked for with a short Korean instruction around it.
const PROMPT = (text, attempt) => (attempt < 2 ? text : `다음 한국어 단어를 그대로 한 번 읽어 주세요:
${text}`);

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const voices = arg("voices") ? VOICES.filter((v) => arg("voices").split(",").includes(v.id)) : VOICES;
const GENERATE = !process.argv.includes("--no-generate");
const CONCURRENCY = Math.max(1, Number(arg("concurrency")) || 2);
let texts = CLIP_TEXTS;
if (arg("limit")) texts = texts.slice(0, Number(arg("limit")));

mkdirSync("data", { recursive: true });
const asrFile = "data/asr.json";
const asr = existsSync(asrFile) ? JSON.parse(readFileSync(asrFile, "utf8")) : {};
const saveAsr = () => writeFileSync(asrFile, JSON.stringify(asr, null, 1) + "\n");
const approved = new Set(existsSync("data/approved.json") ? JSON.parse(readFileSync("data/approved.json", "utf8")) : []);

const rawPath = (voice, id, attempt) => `${RAW}/${voice}/${id}.${attempt}.wav`;
const tries = (voice, id) => [0, 1, 2, 3, 4, 5].filter((t) => existsSync(rawPath(voice, id, t)));

// ---------------------------------------------------------------- rivals and sameness

const SAME_VOWEL = { "ㅐ": "ㅔ", "ㅒ": "ㅖ", "ㅙ": "ㅞ", "ㅚ": "ㅞ" };
const BREATH = [[..."ㄱㅋㄲ"], [..."ㄷㅌㄸ"], [..."ㅂㅍㅃ"], [..."ㅈㅊㅉ"], [..."ㅅㅆ"]];
const VOWEL_RIVAL = { "ㅓ": "ㅗ", "ㅗ": "ㅓ", "ㅜ": "ㅡ", "ㅡ": "ㅜ", "ㅕ": "ㅛ", "ㅛ": "ㅕ", "ㅝ": "ㅘ", "ㅘ": "ㅝ" };
const FINALS = [[..."ㄴㅁㅇ"], [..."ㄱㄷㅂ"]];
const DIGITS = { 1: "일", 2: "이", 3: "삼", 4: "사", 5: "오", 6: "육", 7: "칠", 8: "팔", 9: "구", 10: "십", 100: "백", 1000: "천", 10000: "만" };

/** Hangul only, with vowels said alike made one. */
function norm(text) {
  const t = text.trim().replace(/^[\d,]+$/, (d) => DIGITS[Number(d.replace(/,/g, ""))] ?? d);
  return [...t]
    .filter(isSyllable)
    .map((c) => {
      const s = decompose(c);
      return compose(s.cho, SAME_VOWEL[s.jung] ?? s.jung, s.jong);
    })
    .join("");
}

/** The syllable's neighbours one letter away: breath, the vowel's rival, the closing consonant's group. */
function syllableRivals(c) {
  const s = decompose(c);
  const out = new Set();
  for (const g of BREATH) if (g.includes(s.cho)) for (const x of g) if (x !== s.cho) out.add(compose(x, s.jung, s.jong));
  if (VOWEL_RIVAL[s.jung]) out.add(compose(s.cho, VOWEL_RIVAL[s.jung], s.jong));
  if (s.jong) for (const g of FINALS) if (g.includes(s.jong)) for (const x of g) if (x !== s.jong) out.add(compose(s.cho, s.jung, x));
  return [...out];
}

function rivalsOf(text) {
  const fromPairs = PAIRS.filter((p) => p.includes(text)).flatMap((p) => p.filter((w) => w !== text));
  const syllables = [...text].filter(isSyllable);
  const near = syllables.length === 1 ? syllableRivals(syllables[0]) : [];
  return [...new Set([...fromPairs, ...near])].slice(0, 4);
}

// ---------------------------------------------------------------- checking

async function heardPlain(key, wav) {
  asr[key] ??= {};
  asr[key].plain ??= await withRetry(() => transcribe(wav));
  return asr[key].plain;
}

async function heardWithChoices(key, wav, choices) {
  asr[key] ??= {};
  asr[key].choices ??= {};
  const answers = [];
  for (const model of MODELS) {
    for (const order of [choices, [...choices].reverse()]) {
      const k = `${model}|${order.join(",")}`;
      asr[key].choices[k] ??= await withRetry(() => transcribe(wav, order, model));
      answers.push(asr[key].choices[k]);
    }
  }
  return answers;
}

/** No longer than its syllables allow (and not empty): a made-up sentence or a long silence fails here. */
function lengthFits(wav, text) {
  const { rate, samples } = readWav(wav);
  const seconds = tidy(samples, rate).length / rate;
  const syllables = [...text].filter(isSyllable).length;
  return seconds >= 0.18 && seconds <= 0.55 * syllables + 1.0;
}

/** pass / fail, with what was heard. */
async function check(voice, text, attempt) {
  const id = clipId(text);
  const key = `${voice}/${id}.${attempt}`;
  if (approved.has(key)) return { ok: true, heard: ["（人が確かめた）"] };
  const wav = readFileSync(rawPath(voice, id, attempt));
  if (!lengthFits(wav, text)) return { ok: false, heard: ["（長さが合わない）"] };
  const single = [...text].filter(isSyllable).length === 1;
  const said = WORD.get(text)?.say;
  const right = (a) => norm(a) === norm(text) || (said && norm(a) === norm(said));
  if (!single) {
    const plain = await heardPlain(key, wav);
    if (right(plain)) return { ok: true, heard: [plain] };
  }
  const rivals = rivalsOf(text);
  const answers = await heardWithChoices(key, wav, [text, ...rivals]);
  const hits = answers.filter(right).length;
  const paired = PAIRS.some((p) => p.includes(text));
  const ok = single ? hits >= 3 : paired ? hits === answers.length : hits >= 3;
  return { ok, heard: answers };
}

// ---------------------------------------------------------------- the run

const jobs = [];
for (const v of voices) for (const text of texts) jobs.push({ v, text, id: clipId(text) });

const state = existsSync("data/clips.json") ? JSON.parse(readFileSync("data/clips.json", "utf8")) : { clips: {} };
state.voices = VOICES;
let quotaRefusals = 0;

async function settle(job) {
  const { v, text, id } = job;
  const k = `${v.id}/${id}`;
  const before = state.clips[k];
  // A take passed earlier stands, as long as it is still the right length (the length check came later).
  if (before?.status === "pass" && existsSync(rawPath(v.id, id, before.attempt)) && lengthFits(readFileSync(rawPath(v.id, id, before.attempt)), text)) return;
  for (let attempt = 0; attempt < TRIES; attempt++) {
    if (!existsSync(rawPath(v.id, id, attempt))) {
      if (!GENERATE || quotaRefusals >= 3) break;
      try {
        const wav = await withRetry(() => synthesize(PROMPT(text, attempt), v.name));
        mkdirSync(`${RAW}/${v.id}`, { recursive: true });
        writeFileSync(rawPath(v.id, id, attempt), wav);
        quotaRefusals = 0;
      } catch (err) {
        const msg = String(err?.message ?? err);
        if (/RESOURCE_EXHAUSTED|429/.test(msg)) quotaRefusals++;
        console.error(`  failed to make ${v.id}/${text}: ${msg.slice(0, 160)}`);
        break;
      }
    }
    const r = await check(v.id, text, attempt);
    state.clips[k] = { text, attempt, status: r.ok ? "pass" : "review", heard: r.heard, takes: tries(v.id, id).length };
    if (r.ok) return;
  }
}

let next = 0;
let done = 0;
async function worker() {
  while (next < jobs.length) {
    const job = jobs[next++];
    try {
      await settle(job);
    } catch (err) {
      // One clip that cannot be checked now (the network gone for longer than the retries) does not stop the rest;
      // it stays unsettled and the same command picks it up next time.
      console.error(`  could not settle ${job.v.id}/${job.text}: ${String(err?.message ?? err).slice(0, 160)}`);
    }
    if (++done % 20 === 0) {
      saveAsr();
      writeFileSync("data/clips.json", JSON.stringify(state, null, 1) + "\n");
      const pass = Object.values(state.clips).filter((c) => c.status === "pass").length;
      console.log(`  ${done}/${jobs.length}  (pass ${pass})`);
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
saveAsr();

// Only the texts still in the content are kept.
const wanted = new Set(jobs.map((j) => `${j.v.id}/${j.id}`));
for (const k of Object.keys(state.clips)) if (!wanted.has(k) && voices.some((v) => k.startsWith(`${v.id}/`))) delete state.clips[k];
writeFileSync("data/clips.json", JSON.stringify(state, null, 1) + "\n");

const review = Object.entries(state.clips)
  .filter(([, c]) => c.status !== "pass")
  .map(([k, c]) => ({ clip: k, text: c.text, takes: c.takes, heard: c.heard }));
writeFileSync("data/review.json", JSON.stringify(review, null, 1) + "\n");
const pass = Object.values(state.clips).filter((c) => c.status === "pass").length;
console.log(`pass ${pass} / ${Object.keys(state.clips).length}; waiting for a person: ${review.length} (data/review.json)`);
if (quotaRefusals >= 3) console.log("stopped making clips: the quota keeps refusing. Run the same command later.");
