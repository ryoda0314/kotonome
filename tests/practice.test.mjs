import { test } from "node:test";
import assert from "node:assert/strict";
import { FIRST_LETTERS, PATCHIM, SAID } from "../src/lib/hangul.ts";
import { again, letterPractice, practiceFor, rivalsOf, rounds } from "../src/lib/practice.ts";

const FIRST = new Set(FIRST_LETTERS);

test("rounds: every item each round, never the same twice in a row, the same order every time", () => {
  const seq = rounds(["ㄱ", "ㄴ", "ㅇ"], 3, 42);
  assert.equal(seq.length, 9);
  for (const ch of ["ㄱ", "ㄴ", "ㅇ"]) assert.equal(seq.filter((x) => x === ch).length, 3);
  assert.ok(seq.every((x, i) => i === 0 || x !== seq[i - 1]), seq.join(""));
  assert.deepEqual(rounds(["ㄱ", "ㄴ", "ㅇ"], 3, 42), seq);
  const weighted = rounds(["ㅂ", "ㅂ", "ㅁ", "ㄱ", "ㄴ"], 2, 7);
  assert.equal(weighted.filter((x) => x === "ㅂ").length, 4);
  assert.ok(weighted.every((x, i) => i === 0 || x !== weighted[i - 1]), weighted.join(""));
});

test("a go missed comes once more, a little later", () => {
  assert.deepEqual(again(["a", "b", "c", "d", "e", "f"], 1), ["a", "b", "c", "d", "e", "b", "f"]);
  assert.deepEqual(again(["a", "b"], 1), ["a", "b", "b"]);
});

test("the 90 seconds' practice: each letter three times, heard as its syllable", () => {
  const items = letterPractice(["ㄱ", "ㄴ", "ㅇ", "ㅁ", "ㅅ"], 3);
  assert.equal(items.length, 15);
  assert.deepEqual(items.find((x) => x.answer === "ㅇ").say, "아");
  assert.deepEqual(items.find((x) => x.answer === "ㄱ").say, "가");
});

test("after 気づく: the new letter among what it is told from, more often than they", () => {
  assert.deepEqual(rivalsOf("ㅋ", FIRST)[0], "ㄱ", "the letter it grew from first");
  const items = practiceFor("ㅋ", FIRST);
  assert.equal(items.length, 10);
  assert.equal(items.filter((x) => x.answer === "ㅋ").length, 4);
  assert.ok(items.every((x) => x.choices.includes("ㅋ") && x.choices.includes("ㄱ") && x.choices.length === 4));
  const ae = practiceFor("ㅐ", new Set([...FIRST, "ㅔ"]));
  assert.ok(!ae[0].choices.includes("ㅔ"), "ㅐ and ㅔ are said alike: never both");
  const patchim = practiceFor(PATCHIM, FIRST);
  assert.ok(patchim.length >= 6);
  assert.ok(patchim.every((x) => x.choices.includes(x.answer) && x.choices.length > 1));
  assert.deepEqual(practiceFor(SAID, FIRST), []);
});
