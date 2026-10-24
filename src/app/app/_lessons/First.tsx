"use client";

// 最初の90秒 (CONCEPT.md: 入口): what the film this app grew from shows first, as lightly, a little at a time and
// practised many times right after each part (原則2). The five consonants are pictures of the mouth, three seen from the
// side, then two from the front; then, in the same places, a stroke more makes ㄷ and ㅂ, then ㅈ and ㅎ (the mouth of
// the plain one, the two side by side, the two sounds one after the other); then ㄹ, by its shape. After each part,
// 思い出す: hear it, press its letter, many goes; a wrong press shows the mouth again. The basic vowels are heard, not
// built, and practised the same way. A consonant and a vowel make one square, and three words are read with only these.
// No table to learn, no rules, nothing counted; the rest is the next 90 seconds (Next.tsx) or the rain. Once, and it
// may be passed over.

import type { MouthLetter } from "@/components/Mouth";
import page from "@/components/page.module.css";
import { FIRST_LETTERS } from "@/lib/hangul";
import { ja } from "@/lib/i18n/ja";
import { letterPractice } from "@/lib/practice";
import { Lesson, type LessonPage } from "./Lesson";
import { EndPage, GrowPage, JoinPage, MouthPage, ReadPage, Recall, RieulPage, VowelsPage } from "./pages";

const t = ja.first;
const FIRST = new Set(FIRST_LETTERS);

const mouth = (ch: MouthLetter): LessonPage => ({ key: ch, render: () => <MouthPage ch={ch} /> });
const grow = (ch: string): LessonPage => ({
  key: `grow-${ch}`,
  render: () => <GrowPage chs={[ch]} kicker={t.grow.title} say={t.grow.items[ch].say} how={t.grow.items[ch].how} />,
});
const recall = (key: string, letters: string[], lead: string, done: string): LessonPage => ({
  key,
  render: () => <Recall items={letterPractice(letters, 3)} lead={lead} done={done} />,
});

const PAGES: LessonPage[] = [
  // Seen from the side: the tongue and the throat.
  mouth("ㄱ"),
  mouth("ㄴ"),
  mouth("ㅇ"),
  recall("recall-3", ["ㄱ", "ㄴ", "ㅇ"], t.recall.consonants, t.recall.done(3)),
  // Seen from the front: the lips and the teeth.
  mouth("ㅁ"),
  mouth("ㅅ"),
  recall("recall-5", ["ㄱ", "ㄴ", "ㅇ", "ㅁ", "ㅅ"], t.recall.consonants, t.recall.done(5)),
  // In the same places, a stroke more: two at a time, each two practised at once.
  grow("ㄷ"),
  grow("ㅂ"),
  recall("recall-db", ["ㄴ", "ㄷ", "ㅁ", "ㅂ"], t.recall.consonants, t.recall.donePair("ㄷ", "ㅂ")),
  grow("ㅈ"),
  grow("ㅎ"),
  recall("recall-jh", ["ㅅ", "ㅈ", "ㅇ", "ㅎ"], t.recall.consonants, t.recall.donePair("ㅈ", "ㅎ")),
  { key: "rieul", render: () => <RieulPage /> },
  recall("recall-r", ["ㄴ", "ㄷ", "ㄹ"], t.recall.consonants, t.recall.doneRieul),
  { key: "vowels", render: () => <VowelsPage /> },
  recall("recall-vowels", [..."ㅏㅓㅗㅜㅡㅣ"], t.recall.vowels, t.recall.doneVowels),
  {
    key: "join",
    render: () => (
      <>
        <JoinPage syls={["나", "무"]} title={t.join.title} lead={t.join.lead} />
        <ReadPage words={t.join.words} lead={t.join.read} known={FIRST} />
      </>
    ),
  },
  { key: "end", render: () => <EndPage title={t.end.title} body={t.end.body} letters={FIRST_LETTERS} /> },
];

export function First({ onFinish }: { onFinish: () => void }) {
  return (
    <Lesson
      title={t.title}
      pages={PAGES}
      finish={t.end.start}
      onFinish={onFinish}
      aside={
        <button type="button" className={page.barButton} onClick={onFinish}>
          {t.skip}
        </button>
      }
    />
  );
}
