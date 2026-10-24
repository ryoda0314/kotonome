import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { KEY_OF } from "../src/lib/dubeol.ts";
import { canRead, emptyState, knownSet, readWord, seeFirst, typedWord } from "../src/lib/record.ts";
import { DRILLS, drillSequence, pickTypingLines, pickTypingWords } from "../src/lib/typing-core.ts";

const SENTENCES = JSON.parse(readFileSync("src/content/sentences.json", "utf8"));
const seeded = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

test("the rows of 자리연습 are the keyboard's, and all of them together are every key", () => {
  for (const d of DRILLS) for (const k of d.keys) assert.ok(KEY_OF.has(k), `${d.id}: ${k}`);
  assert.equal(DRILLS.find((d) => d.id === "all").keys.length, 26);
  assert.deepEqual(DRILLS.find((d) => d.id === "shift").keys, [..."ㅃㅉㄸㄲㅆㅒㅖ"]);
});

test("a round of 자리연습: every key comes, never the same twice in a row", () => {
  const keys = DRILLS.find((d) => d.id === "home").keys;
  const seq = drillSequence(keys, seeded(4), 24);
  assert.equal(seq.length, 24);
  assert.ok(keys.every((k) => seq.includes(k)));
  assert.ok(seq.every((k, i) => i === 0 || k !== seq[i - 1]));
});

test("words to type: readable ones, those read and not typed yet first", () => {
  let s = seeFirst(emptyState(), 1);
  s = readWord(s, "스시", 2);
  s = readWord(s, "나무", 3);
  s = typedWord(s, "나무", 4);
  const words = pickTypingWords(s, 10, seeded(9));
  assert.equal(words.length, 8);
  assert.ok(words.every((w) => canRead(w, knownSet(s))));
  assert.equal(words[0].ko, "스시");
});

test("sentences to type: the fewest letters not met first", () => {
  const s = seeFirst(emptyState(), 1);
  const lines = pickTypingLines(SENTENCES, s, 10, seeded(1));
  assert.equal(lines.length, 4);
  assert.ok(lines.every((l) => SENTENCES.includes(l)));
});
