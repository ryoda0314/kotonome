import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { WORDS, WORD } from "../src/content/words.ts";
import { PAIRS, pairsFor } from "../src/content/pairs.ts";
import { CLIP_TEXTS, DEMO_SYLLABLES } from "../src/content/clips.ts";
import { ALL_ITEMS, clipId, FIRST_LETTERS, isSyllable, LETTERS, lettersOf, MEET_ORDER, needsOf, PATCHIM } from "../src/lib/hangul.ts";
import { wordsOpenedBy } from "../src/lib/rain-core.ts";

const CLOSING_PAIRS = new Set([..."ㄳㄵㄶㄺㄻㄼㄽㄾㄿㅀㅄ"]);
const audio = JSON.parse(readFileSync("src/content/audio.json", "utf8"));

test("every word once, in Hangul, with a meaning", () => {
  assert.equal(new Set(WORDS.map((w) => w.ko)).size, WORDS.length, "a word twice");
  for (const w of WORDS) {
    assert.ok([...w.ko].every(isSyllable), `${w.ko}: Hangul syllables only`);
    assert.ok(w.ja.trim(), `${w.ko}: a meaning`);
    if (w.say) {
      assert.ok([...w.say].every(isSyllable), `${w.ko}: say in Hangul`);
      assert.notEqual(w.say, w.ko, `${w.ko}: say only where it differs`);
      assert.equal([...w.say].length, [...w.ko].length, `${w.ko}: as many syllables said as written`);
    }
    assert.ok(!lettersOf(w.ko).some((l) => CLOSING_PAIRS.has(l.ch)), `${w.ko}: no closing pair`);
  }
});

test("everything there is to meet: the 90 seconds, then MEET_ORDER, every letter once", () => {
  assert.equal(new Set(ALL_ITEMS).size, ALL_ITEMS.length);
  const letters = ALL_ITEMS.filter((x) => LETTERS.some((l) => l.ch === x));
  assert.equal(letters.length, 40);
  assert.equal(FIRST_LETTERS.length, 16);
});

test("each thing met opens words of its own once those before it are met, and every word is opened", () => {
  const known = new Set(FIRST_LETTERS);
  assert.ok(WORDS.filter((w) => needsOf(w).length === 0).length >= 30, "enough for the first rains");
  for (const item of MEET_ORDER) {
    const opened = wordsOpenedBy(item, known);
    assert.ok(opened.length >= 2, `${item} opens ${opened.map((w) => w.ko).join(" ")}`);
    known.add(item);
  }
  for (const w of WORDS) assert.ok(needsOf(w).every((n) => known.has(n)), w.ko);
});

test("every word has a clip (all but those waiting for a person's ear)", () => {
  const missing = WORDS.filter((w) => !audio.have[clipId(w.ko)]?.length).map((w) => w.ko);
  assert.ok(missing.length <= 2, `no clip: ${missing.join(" ")}`);
  for (const s of DEMO_SYLLABLES) assert.ok(audio.have[clipId(s)]?.length, `no clip: ${s}`);
});

test("pairs: words in the list, one letter apart, as long as each other; found for what they tell apart", () => {
  for (const p of PAIRS) {
    for (const ko of p) assert.ok(WORD.has(ko), `${ko} (pair ${p.join("/")}) is in words.ts`);
    assert.ok(p.every((w) => [...w].length === [...p[0]].length), p.join("/"));
  }
  const all = () => true;
  assert.ok(pairsFor("ㄸ", all).some((p) => p.includes("딸") && p.includes("달")));
  assert.ok(pairsFor(PATCHIM, all).some((p) => p.includes("산") && p.includes("상")));
  assert.deepEqual(pairsFor("ㄸ", (ko) => ko !== "딸"), [], "a group left without the new letter is dropped");
});

test("every clip has its own name", () => {
  const ids = CLIP_TEXTS.map(clipId);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(DEMO_SYLLABLES.every((s) => [...s].length === 1 && isSyllable(s)));
});
