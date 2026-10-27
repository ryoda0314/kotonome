import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { lettersOf, MEET_ORDER, needsOf, PATCHIM } from "../src/lib/hangul.ts";
import { canRead, finishRain, knownSet, meetLetters, mixLetters, RETURN_MS, seeFirst } from "../src/lib/record.ts";
import { LINE_UNKNOWN_MAX, pickLines, planRain } from "../src/lib/rain-core.ts";
import { unknownIn } from "../src/lib/record.ts";

const SENTENCES = JSON.parse(readFileSync("src/content/sentences.json", "utf8"));
const seeded = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

/** One rain gone through: the new one met, the rain kept. */
function through(s, plan) {
  const met = plan.fresh ? [plan.fresh] : [];
  return finishRain(meetLetters(s, met, plan.at), { at: plan.at, words: plan.words.map((w) => w.ko), met, mixed: [], typed: [] });
}

test("the first rain: only the first 16 letters, nothing new, no sentences yet", () => {
  const s = seeFirst({ v: 2, letters: {}, words: {}, lines: {}, drills: {}, rains: [] }, 1);
  const plan = planRain(s, 1000, SENTENCES, seeded(5));
  assert.equal(plan.fresh, null);
  assert.equal(plan.words.length, 6);
  assert.ok(plan.words.every((w) => needsOf(w).length === 0), plan.words.map((w) => w.ko).join(" "));
  assert.equal(plan.types.length, 3);
  assert.ok(plan.types.every((w) => plan.words.includes(w)));
  assert.deepEqual(plan.lines, []);
});

test("rain after rain, one new thing each, in MEET_ORDER, until everything is met", () => {
  let s = seeFirst({ v: 2, letters: {}, words: {}, lines: {}, drills: {}, rains: [] }, 1);
  const rand = seeded(11);
  s = through(s, planRain(s, 1000, SENTENCES, rand));
  const order = [];
  let withLines = 0;
  for (let n = 0; n < 40; n++) {
    const at = 2000 + n * 1000;
    const plan = planRain(s, at, SENTENCES, rand);
    if (!plan.fresh) break;
    order.push(plan.fresh);
    const known = knownSet(s).add(plan.fresh);
    const holding = plan.words.filter((w) => needsOf(w).includes(plan.fresh));
    assert.ok(holding.length >= 2, `${plan.fresh}: ${plan.words.map((w) => w.ko).join(" ")}`);
    assert.ok(plan.words.every((w) => canRead(w, known)), `${plan.fresh}: every word readable with it`);
    assert.ok(needsOf(plan.types[0]).includes(plan.fresh), "the new one is typed first");
    for (const l of plan.lines) assert.ok(unknownIn({ ko: l.sentence.ko }, known).length <= LINE_UNKNOWN_MAX);
    if (plan.lines.length) withLines++;
    s = through(s, plan);
  }
  assert.deepEqual(order, MEET_ORDER);
  // From the rain that brings パッチム on, nearly every rain has sentences to read its words in.
  const fromPatchim = order.length - order.indexOf(PATCHIM);
  assert.ok(withLines >= fromPatchim - 2, `sentences in ${withLines} of ${fromPatchim} rains`);
});

test("a letter met by looking it up is passed over; a letter typed off the way comes back first", () => {
  let s = seeFirst({ v: 2, letters: {}, words: {}, lines: {}, drills: {}, rains: [] }, 1);
  s = finishRain(s, { at: 10, words: [], met: [], mixed: [], typed: [] });
  s = meetLetters(s, [PATCHIM, "ㅋ"], 20);
  assert.equal(planRain(s, 30, SENTENCES, seeded(2)).fresh, "ㅍ");
  s = mixLetters(s, ["ㅓ"], 40);
  const plan = planRain(s, 40 + RETURN_MS, SENTENCES, seeded(3));
  assert.deepEqual(plan.due, ["ㅓ"]);
  const withEo = plan.words.filter((w) => lettersOf(w.ko).some((l) => l.ch === "ㅓ"));
  assert.ok(withEo.length >= 2, plan.words.map((w) => w.ko).join(" "));
});

test("sentences: holding the word, the fewest letters not met first", () => {
  const known = knownSet(meetLetters(seeFirst({ v: 2, letters: {}, words: {}, lines: {}, drills: {}, rains: [] }, 1), [PATCHIM], 2));
  const lines = pickLines(SENTENCES, ["가방", "커피", "없는말"], known);
  assert.ok(lines.length >= 1);
  for (const l of lines) {
    assert.ok(l.sentence.words.includes(l.word));
    assert.ok(unknownIn({ ko: l.sentence.ko }, known).length <= LINE_UNKNOWN_MAX);
  }
});
