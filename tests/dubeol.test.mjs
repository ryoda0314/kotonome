import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { WORDS } from "../src/content/words.ts";
import {
  back,
  composing,
  emptyKb,
  guide,
  isDone,
  jamoOf,
  KEY_OF,
  keysFor,
  normalize,
  press,
  ROWS,
  textOf,
  typeKeys,
} from "../src/lib/dubeol.ts";
import { clipId, romanize } from "../src/lib/hangul.ts";

const typeText = (text) => typeKeys(keysFor(text).map((s) => s.key));

test("the keyboard: 26 keys, 33 letters with Shift, each in one place", () => {
  assert.equal(ROWS.flat().length, 26);
  assert.equal(KEY_OF.size, 33);
  assert.deepEqual(ROWS[1].map((k) => k.jamo).join(""), "ㅁㄴㅇㄹㅎㅗㅓㅏㅣ");
  assert.equal(jamoOf("KeyR", false), "ㄱ");
  assert.equal(jamoOf("KeyR", true), "ㄲ");
  assert.equal(jamoOf("KeyK", true), "ㅏ", "Shift on a key with nothing above it is the same letter");
  assert.equal(jamoOf("Digit1", false), undefined);
  assert.deepEqual(KEY_OF.get("ㅖ"), { code: "KeyP", shift: true, finger: "rp", face: "ㅔ" });
});

test("a consonant after a vowel closes the syllable; a vowel takes it along", () => {
  const steps = [];
  let kb = emptyKb();
  for (const k of ["ㄴ", "ㅏ", "ㅁ", "ㅜ"]) {
    kb = press(kb, k);
    steps.push(textOf(kb));
  }
  assert.deepEqual(steps, ["ㄴ", "나", "남", "나무"]);
  assert.equal(composing(kb), "무");
  assert.equal(textOf(typeKeys(["ㅎ", "ㅏ", "ㄴ", "ㄱ", "ㅡ", "ㄹ"])), "한글");
  assert.equal(textOf(typeKeys(["ㅇ", "ㅗ", "ㅃ", "ㅏ"])), "오빠", "ㅃ never closes a syllable");
  assert.equal(textOf(typeKeys(["ㄱ", "ㅅ"])), "ㄱㅅ", "two consonants with no vowel stay apart");
});

test("two vowels make one, two closing consonants make one, and come apart before a vowel", () => {
  assert.equal(textOf(typeKeys(["ㄱ", "ㅗ", "ㅏ"])), "과");
  assert.equal(textOf(typeKeys(["ㅇ", "ㅡ", "ㅣ"])), "의");
  assert.equal(textOf(typeKeys(["ㄷ", "ㅗ", "ㅐ", "ㅈ", "ㅣ"])), "돼지");
  assert.equal(textOf(typeKeys(["ㄷ", "ㅏ", "ㄹ", "ㄱ"])), "닭");
  assert.equal(textOf(typeKeys(["ㅇ", "ㅏ", "ㄴ", "ㅈ", "ㅏ"])), "안자", "ㄵ gives its ㅈ to the vowel");
  assert.equal(textOf(typeKeys(["ㅇ", "ㅓ", "ㅂ", "ㅅ", "ㅇ", "ㅓ", "ㅇ", "ㅛ"])), "없어요");
  assert.equal(textOf(typeText("괜찮아요")), "괜찮아요");
});

test("every word, and every sentence borrowed from ことのあめ, types from its own keys", () => {
  for (const w of WORDS) {
    const plan = keysFor(w.ko);
    const kb = typeKeys(plan.map((s) => s.key));
    assert.equal(textOf(kb), w.ko, w.ko);
    assert.ok(isDone(kb, plan), w.ko);
  }
  const sentences = JSON.parse(readFileSync("src/content/sentences.json", "utf8"));
  for (const s of sentences) assert.equal(textOf(typeText(s.ko)), normalize(s.ko), s.ko);
});

test("only what is typed is compared: punctuation and spare spaces are left out", () => {
  assert.equal(normalize("맞아, 거기 좀  비싸. "), "맞아 거기 좀 비싸");
  assert.deepEqual(
    keysFor("과 차").map((s) => `${s.key}${s.letter}`),
    ["ㄱㄱ", "ㅗㅘ", "ㅏㅘ", "  ", "ㅊㅊ", "ㅏㅏ"],
  );
});

test("the guide follows the way, and asks for ⌫ when a key went off it", () => {
  const plan = keysFor("커피");
  let kb = emptyKb();
  assert.equal(guide(kb, plan).next.key, "ㅋ");
  kb = typeKeys(["ㅋ", "ㅓ", "ㅍ"]);
  assert.deepEqual(guide(kb, plan), { next: plan[3], back: 0, missed: null, ok: 3 });
  kb = typeKeys(["ㅋ", "ㅗ", "ㅍ"]);
  const g = guide(kb, plan);
  assert.equal(g.back, 2);
  assert.equal(g.next, null);
  assert.equal(g.missed.letter, "ㅓ", "the letter that should have come");
  kb = back(back(kb));
  assert.equal(textOf(kb), "ㅋ");
  assert.equal(guide(kb, plan).next.key, "ㅓ");
  assert.equal(isDone(typeText("커피"), plan), true);
});

test("clip names are stable and readable", () => {
  assert.equal(romanize("커피"), "keopi");
  assert.equal(romanize("한글"), "hangeul");
  assert.match(clipId("커피"), /^keopi-[0-9a-f]{4}$/);
  assert.equal(clipId("커피"), clipId("커피"));
  assert.notEqual(clipId("가"), clipId("까"));
});
