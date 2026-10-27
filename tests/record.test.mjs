import { test } from "node:test";
import assert from "node:assert/strict";
import { FIRST_LETTERS, needsOf, PATCHIM, SAID } from "../src/lib/hangul.ts";
import {
  canRead,
  clearLetters,
  dueLetters,
  emptyState,
  finishRain,
  freshLetters,
  isOwed,
  knownSet,
  meetLetters,
  mergeStates,
  mixLetters,
  readWord,
  RETURN_MS,
  revive,
  seeFirst,
  typedWord,
} from "../src/lib/record.ts";

const rain = (at, more = {}) => ({ at, words: [], met: [], mixed: [], typed: [], ...more });

test("what a word asks of the reader beyond 最初の16字", () => {
  assert.deepEqual(needsOf({ ko: "나무" }), []);
  assert.deepEqual(needsOf({ ko: "라디오" }), [], "the letters grown from the five are among 最初の16字 too");
  assert.deepEqual(needsOf({ ko: "커피" }).sort(), ["ㅋ", "ㅍ"].sort());
  assert.deepEqual(needsOf({ ko: "김" }), [PATCHIM]);
  assert.deepEqual(needsOf({ ko: "음악", say: "으막" }).sort(), [PATCHIM, SAID].sort());
  assert.ok(!needsOf({ ko: "꽃", say: "꼳" }).includes(SAID), "a closing consonant said as one of seven is パッチム's");
});

test("the first 16 letters are there from the start; the rest once met", () => {
  const s = emptyState();
  assert.equal(knownSet(s).size, FIRST_LETTERS.length);
  assert.ok(canRead({ ko: "스시" }, knownSet(s)));
  assert.ok(canRead({ ko: "바나나" }, knownSet(s)));
  assert.ok(!canRead({ ko: "커피" }, knownSet(s)));
  const t = meetLetters(s, ["ㅋ", "ㅍ"], 10);
  assert.ok(canRead({ ko: "커피" }, knownSet(t)));
  assert.ok(!canRead({ ko: "김" }, knownSet(t)), "the letter under the vowel is met too");
  const f = seeFirst(s, 5);
  assert.equal(f.first, 5);
  assert.equal(f.letters["ㄱ"].met, 5);
  assert.equal(seeFirst(f, 9).first, 5, "seen once");
});

test("letters typed off the way are owed, come back when due, and are cleared when typed right", () => {
  let s = mixLetters(emptyState(), ["ㅓ"], 10_000);
  assert.ok(isOwed(s, "ㅓ"));
  assert.deepEqual(dueLetters(s, 10_001), [], "not at once");
  assert.deepEqual(dueLetters(s, 10_000 + RETURN_MS), ["ㅓ"], "after a while");
  s = finishRain(finishRain(s, rain(20_000)), rain(30_000));
  assert.deepEqual(dueLetters(s, 30_001), ["ㅓ"], "or after two rains");
  s = clearLetters(s, ["ㅓ", "ㄱ"], 40_000);
  assert.equal(isOwed(s, "ㅓ"), false);
});

test("letters met in the last two rains come again", () => {
  let s = seeFirst(emptyState(), 1);
  s = finishRain(s, rain(100));
  s = meetLetters(s, ["ㅋ"], 150);
  s = finishRain(s, rain(200, { met: ["ㅋ"] }));
  assert.deepEqual(freshLetters(s), ["ㅋ"], "the first 16 letters are not fresh");
  s = finishRain(finishRain(s, rain(300)), rain(400));
  assert.deepEqual(freshLetters(s), []);
});

test("two copies made one lose nothing", () => {
  let a = readWord(seeFirst(emptyState(), 100), "아이", 200);
  let b = readWord(seeFirst(emptyState(), 50), "아이", 300);
  b = typedWord(mixLetters(b, ["ㄴ"], 400), "나무", 410);
  const m = mergeStates(a, b);
  assert.equal(m.first, 50);
  assert.deepEqual(m.words["아이"].read, [200, 300]);
  assert.deepEqual(m.words["나무"].typed, [410]);
  assert.ok(isOwed(m, "ㄴ"));
  assert.deepEqual(mergeStates(m, m), m);
  a = finishRain(a, rain(500));
  assert.equal(mergeStates(a, b).rains.length, 1);
});

test("a record from before the redesign is left behind", () => {
  assert.equal(revive({ v: 1, steps: { mouth: 1 }, letters: {}, words: {}, pairs: {}, rains: [] }), null);
  assert.equal(revive(null), null);
  assert.deepEqual(revive({ v: 2, letters: {} }), { ...emptyState(), letters: {} });
});
