import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { holds, pieceOf } from "../src/lib/sentences.ts";
import { WORD } from "../src/content/words.ts";

test("a word stands as a word, with a particle after it, never as a bare prefix", () => {
  assert.equal(pieceOf("가게 앞에서 기다릴게", "가게"), 0);
  assert.equal(pieceOf("가게에서 만나", "가게"), 0);
  assert.equal(pieceOf("내일 카페 갈래?", "카페"), 1);
  assert.equal(holds("간단히 먹고 나서 갈게.", "간"), false, "간 is 肝臓, not the start of 간단히");
  assert.equal(holds("아이스크림 먹자", "아이"), false, "아이 is not the start of 아이스크림");
  assert.equal(holds("이거 해?", "해"), false, "해 as 'do' is not 해 the sun");
  assert.equal(holds("친구예요", "친구"), true);
});

test("the borrowed sentences: each with its clip, its words in the list, standing in the sentence", () => {
  const all = JSON.parse(readFileSync("src/content/sentences.json", "utf8"));
  assert.ok(all.length > 100);
  for (const s of all) {
    assert.match(s.audio, /^https:\/\/.+\/pl-audio\/Kore\/ko\/[0-9a-f]{64}\.wav$/);
    assert.ok(s.ja.trim(), s.ko);
    for (const w of s.words) {
      assert.ok(WORD.has(w), `${w} in words.ts`);
      assert.ok(holds(s.ko, w), `${w} stands in ${s.ko}`);
    }
  }
});
