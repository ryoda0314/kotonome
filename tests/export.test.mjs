import { test } from "node:test";
import assert from "node:assert/strict";
import { exportMarkdown } from "../src/lib/export.ts";
import { PATCHIM } from "../src/lib/hangul.ts";
import { emptyState, finishRain, meetLetters, mixLetters, readWord, seeFirst, typedWord } from "../src/lib/record.ts";

test("the record as one text: counts, letters in the order met, letters typed off the way, days", () => {
  const at = (h) => Date.UTC(2026, 9, 22, h);
  let s = seeFirst(emptyState(), at(1));
  s = readWord(s, "아이", at(2));
  s = meetLetters(s, [PATCHIM], at(3));
  s = typedWord(mixLetters(s, ["ㅓ"], at(3)), "거기", at(3));
  s = finishRain(s, { at: at(4), words: ["아이", "김"], met: [PATCHIM], mixed: ["ㅓ"], typed: ["거기"] });
  const md = exportMarkdown(s, "PROMPT");
  assert.ok(md.startsWith("PROMPT\n"));
  assert.match(md, /最初の16字: 2026-10-22 に見た/);
  assert.match(md, /出会った字: 16 \/ 40（パッチムも）/);
  assert.match(md, /- パッチム: 2026-10-22/);
  assert.match(md, /ㅓ（オ）: 1 回、まだまた降ってくる/);
  assert.match(md, /2026-10-22: 雨 1、浴びた語 아이 김、はじめての字 パッチム、打ち間違えた字 ㅓ/);
});
