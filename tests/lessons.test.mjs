import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { WORD } from "../src/content/words.ts";
import { clipId, FIRST_LETTERS, LETTER, LETTERS, needsOf, soundOf } from "../src/lib/hangul.ts";
import { ja } from "../src/lib/i18n/ja.ts";
import { LESSONS } from "../src/lib/lessons.ts";
import { sameSound } from "../src/lib/practice.ts";
import { emptyState, knownSet, mergeStates, seeFirst, seeLesson } from "../src/lib/record.ts";

const audio = JSON.parse(readFileSync("src/content/audio.json", "utf8"));
const hasClip = (text) => (audio.have[clipId(text)] ?? []).length > 0;

test("最初の16字 and 次の字 bring every letter once", () => {
  const all = [...FIRST_LETTERS, ...LESSONS.flatMap((l) => l.items.filter((x) => LETTER.has(x)))];
  assert.equal(new Set(all).size, all.length);
  assert.deepEqual(new Set(all), new Set(LETTERS.map((l) => l.ch)));
});

test("each lesson: letters beside what they come from, practised among known ones, words readable with it alone", () => {
  for (const lesson of LESSONS) {
    const known = new Set([...FIRST_LETTERS, ...lesson.items]);
    const shown = new Set();
    const copy = ja.next.lessons[lesson.id];
    assert.ok(copy?.name && copy.lead && copy.end?.title, `${lesson.id}: its words`);
    for (const step of lesson.steps) {
      const where = `${lesson.id} ${step.kind}:${step.key}`;
      if (step.kind === "grow") {
        assert.ok(copy.grow[step.key]?.say, `${where}: its words`);
        for (const ch of step.chs) {
          assert.ok(lesson.items.includes(ch), where);
          assert.ok(LETTER.get(ch).from?.every((f) => known.has(f)), `${where}: ${ch} comes from known letters`);
          assert.ok(hasClip(soundOf(ch)), `${where}: ${soundOf(ch)} has a clip`);
          shown.add(ch);
        }
      }
      if (step.kind === "practice") {
        for (const ch of step.letters) {
          assert.ok(FIRST_LETTERS.includes(ch) || shown.has(ch), `${where}: ${ch} shown before it is practised`);
          assert.ok(hasClip(soundOf(ch)), `${where}: ${soundOf(ch)} has a clip`);
        }
        for (const a of step.letters) for (const b of step.letters) if (a !== b) assert.ok(!sameSound(a, b), `${where}: ${a} ${b} sound alike`);
      }
      const words = step.kind === "read" || step.kind === "show" ? step.words : step.kind === "words" || step.kind === "compare" ? step.groups.flat() : [];
      for (const ko of words) {
        const w = WORD.get(ko);
        assert.ok(w, `${where}: ${ko} in words.ts`);
        assert.ok(hasClip(ko), `${where}: ${ko} has a clip`);
        assert.ok(needsOf(w).every((x) => known.has(x)), `${where}: ${ko} readable with this lesson alone`);
      }
      if (step.kind === "show") assert.ok(ja.next.lessons.patchim.show[step.key], where);
      if (step.kind === "words") assert.ok(ja.next.lessons.patchim.words[step.key], where);
    }
    for (const ch of lesson.items.filter((x) => LETTER.has(x))) assert.ok(shown.has(ch), `${lesson.id}: ${ch} is shown`);
  }
});

test("a lesson gone through meets its letters, and two copies keep it", () => {
  const s = seeLesson(seeFirst(emptyState(), 1), "breath", LESSONS[0].items, 50);
  assert.equal(s.lessons.breath, 50);
  assert.ok(knownSet(s).has("ㅋ") && knownSet(s).has("ㅉ"));
  assert.equal(seeLesson(s, "breath", LESSONS[0].items, 90).lessons.breath, 50, "the first time is kept");
  const other = seeLesson(emptyState(), "breath", LESSONS[0].items, 30);
  assert.equal(mergeStates(s, other).lessons.breath, 30);
});
