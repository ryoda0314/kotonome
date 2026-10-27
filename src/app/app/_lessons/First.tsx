"use client";

// 最初の16字 (CONCEPT.md: 入口): what the film this app grew from shows first, as lightly, a little at a time and
// practised many times right after each part (原則2). The five consonants are pictures of the mouth, three seen from the
// side, then two from the front, each slowly and as often as wanted; a consonant is heard with ㅏ (가), drawn faint, and
// said to be the left one. Then, in the same places, a stroke more makes ㄷ and ㅂ, then ㅈ and ㅎ (the mouth of the
// plain one, the two side by side, the two sounds one after the other, twice); then ㄹ, by its shape. After each part,
// 思い出す: hear it, press its letter, many goes; a wrong press shows the mouth again, the letter on it. The basic vowels
// are heard, not built, two at a time with their mouths from the front (ㅏ ㅣ, then the two オ, then the two ウ), and
// practised the same way. A consonant and a vowel come together into one square (and ㅇ, without a sound, where a vowel
// is read on its own), a word is read one square at a time, and three words are read with only these. No table to
// learn, nothing counted; the rest is 次の字 (Next.tsx) or the rain. Once, and it may be passed over.

import type { MouthLetter } from "@/components/Mouth";
import page from "@/components/page.module.css";
import { FIRST_LETTERS } from "@/lib/hangul";
import { ja } from "@/lib/i18n/ja";
import { letterPractice } from "@/lib/practice";
import { Lesson, type LessonPage } from "./Lesson";
import {
  EndPage,
  GrowPage,
  JoinPage,
  MouthPage,
  ReadPage,
  Recall,
  RieulPage,
  StepReadPage,
  VOWEL_LATER,
  VowelPairPage,
} from "./pages";

const t = ja.first;
const FIRST = new Set(FIRST_LETTERS);

/** The narration's lines (src/content/narration.json) for a grown letter, and the hint said after a miss in 思い出す. */
const GROW_VOICE: Record<string, string> = {
  ㄷ: "d",
  ㅂ: "b",
  ㅈ: "j",
  ㅎ: "h",
};
const HINT_VOICE: Record<string, string> = {
  ㄱ: "hint-g",
  ㄴ: "hint-n",
  ㅇ: "hint-o",
  ㅁ: "hint-m",
  ㅅ: "hint-s",
  ㄷ: "d-how",
  ㅂ: "b-how",
  ㅈ: "j-how",
  ㅎ: "h-how",
  ㄹ: "hint-r",
  ㅏ: "hint-a",
  ㅓ: "hint-eo",
  ㅗ: "hint-o2",
  ㅜ: "hint-u",
  ㅡ: "hint-eu",
  ㅣ: "hint-i",
};
const hintVoice = (answer: string) => HINT_VOICE[answer];

const mouth = (ch: MouthLetter): LessonPage => ({
  key: ch,
  render: () => <MouthPage ch={ch} />,
});
const grow = (ch: string): LessonPage => ({
  key: `grow-${ch}`,
  render: () => (
    <GrowPage
      chs={[ch]}
      kicker={t.grow.title}
      say={t.grow.items[ch].say}
      how={t.grow.items[ch].how}
      faint={VOWEL_LATER}
      note={t.grow.leftOnly}
      voice={{
        say: `${GROW_VOICE[ch]}-say`,
        how: `${GROW_VOICE[ch]}-how`,
        after: ch === "ㄷ" ? "grow-left" : undefined,
      }}
    />
  ),
});
const vowels = (key: string, chs: string[]): LessonPage => ({
  key: `vowels-${key}`,
  render: () => (
    <VowelPairPage
      chs={chs}
      title={t.vowels.pages[key].title}
      lead={t.vowels.pages[key].lead}
      voice={`v-${key}`}
    />
  ),
});
const recall = (
  key: string,
  letters: string[],
  lead: string,
  done: string,
): LessonPage => ({
  key,
  // The first says what to do before its goes start.
  render: () => (
    <Recall
      items={letterPractice(letters, 3)}
      lead={lead}
      done={done}
      hintVoice={hintVoice}
      voice={key === "recall-3" ? "recall" : undefined}
    />
  ),
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
  recall(
    "recall-5",
    ["ㄱ", "ㄴ", "ㅇ", "ㅁ", "ㅅ"],
    t.recall.consonants,
    t.recall.done(5),
  ),
  // In the same places, a stroke more: two at a time, each two practised at once.
  grow("ㄷ"),
  grow("ㅂ"),
  recall(
    "recall-db",
    ["ㄴ", "ㄷ", "ㅁ", "ㅂ"],
    t.recall.consonants,
    t.recall.donePair("ㄷ", "ㅂ"),
  ),
  grow("ㅈ"),
  grow("ㅎ"),
  recall(
    "recall-jh",
    ["ㅅ", "ㅈ", "ㅇ", "ㅎ"],
    t.recall.consonants,
    t.recall.donePair("ㅈ", "ㅎ"),
  ),
  { key: "rieul", render: () => <RieulPage voice="r" /> },
  recall(
    "recall-r",
    ["ㄴ", "ㄷ", "ㄹ"],
    t.recall.consonants,
    t.recall.doneRieul,
  ),
  // The vowels two at a time: the easy two, then the two オ, then the two ウ, each said alike in Japanese told apart by
  // the mouth.
  vowels("ai", ["ㅏ", "ㅣ"]),
  vowels("o", ["ㅓ", "ㅗ"]),
  recall(
    "recall-vowels-4",
    ["ㅏ", "ㅓ", "ㅗ", "ㅣ"],
    t.recall.vowels,
    t.recall.doneVowelsSome(4),
  ),
  vowels("u", ["ㅜ", "ㅡ"]),
  recall(
    "recall-vowels",
    [..."ㅏㅓㅗㅜㅡㅣ"],
    t.recall.vowels,
    t.recall.doneVowels,
  ),
  {
    key: "join",
    render: () => (
      <JoinPage
        syls={t.join.syls}
        title={t.join.title}
        lead={t.join.lead}
        notes={t.join.notes}
        after={t.join.silent}
        voice={{ lead: "join", after: "join-silent" }}
      />
    ),
  },
  {
    key: "read",
    render: () => (
      <>
        <StepReadPage
          word={t.read.word}
          title={t.read.title}
          lead={t.read.lead}
          voice={{ lead: "read", then: "read-self" }}
        />
        <ReadPage words={t.read.words} lead={t.read.self} known={FIRST} />
      </>
    ),
  },
  {
    key: "end",
    render: () => (
      <EndPage
        title={t.end.title}
        body={t.end.body}
        letters={FIRST_LETTERS}
        voice="end"
      />
    ),
  },
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
