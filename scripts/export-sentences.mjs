// Borrows ことのあめ's Korean example sentences for 文の中で (the last part of a rain) and 短文 (打つ): short
// approved sentences holding one of this app's words, with their Japanese and the clip ことのあめ already stores
// (pl-audio/Kore/ko/<SHA-256 of the sentence>.wav, its src/lib/audio.ts). Reads only, with ことのあめ's public values
// (the anon key its pages hand to every browser; approved sentences are readable with it). Writes
// src/content/sentences.json, keeping only sentences whose clip is really there.
//   node --env-file=../polylinga/.env.local scripts/export-sentences.mjs
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { WORDS } from "../src/content/words.ts";
import { isSyllable } from "../src/lib/hangul.ts";
import { holds } from "../src/lib/sentences.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY が要ります（ことのあめ の .env.local を --env-file で）");

const MAX_SYLLABLES = 14;
const PER_WORD = 3;
const audioOf = (ko) => `${url}/storage/v1/object/public/pl-audio/Kore/ko/${createHash("sha256").update(ko, "utf8").digest("hex")}.wav`;

const rows = [];
for (let offset = 0; ; offset += 1000) {
  const res = await fetch(`${url}/rest/v1/pl_sentences?select=key,ko,ja&status=eq.approved&order=key.asc&limit=1000&offset=${offset}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`読めませんでした: ${res.status} ${await res.text()}`);
  const page = await res.json();
  rows.push(...page);
  if (page.length < 1000) break;
}
console.log(`${rows.length} approved sentences`);

// Short, and nothing but Hangul, spaces and the usual punctuation (no Latin letters or digits to stumble on).
const plain = rows.filter((r) => {
  const chars = [...(r.ko ?? "")];
  const syllables = chars.filter(isSyllable).length;
  return syllables > 0 && syllables <= MAX_SYLLABLES && chars.every((c) => isSyllable(c) || /[\s.,!?~…'"]/.test(c));
});

// A word stands in a sentence as a word (src/lib/sentences.ts: the word and a particle after it, not a bare prefix).
// For each word, its shortest sentences.
const chosen = new Map();
for (const w of WORDS) {
  const hits = plain
    .filter((r) => holds(r.ko, w.ko))
    .sort((a, b) => [...a.ko].length - [...b.ko].length)
    .slice(0, PER_WORD);
  for (const r of hits) chosen.set(r.key, r);
}

const out = [];
let missing = 0;
for (const r of chosen.values()) {
  const audio = audioOf(r.ko);
  const head = await fetch(audio, { method: "HEAD" }).catch(() => null);
  if (!head?.ok) {
    missing++;
    continue;
  }
  const words = WORDS.filter((w) => holds(r.ko, w.ko)).map((w) => w.ko);
  out.push({ ko: r.ko, ja: r.ja, audio, words });
}
out.sort((a, b) => a.ko.localeCompare(b.ko, "ko"));
writeFileSync("src/content/sentences.json", JSON.stringify(out, null, 1) + "\n");
console.log(`${out.length} sentences kept (${missing} without a clip), for ${new Set(out.flatMap((s) => s.words)).size} words`);
