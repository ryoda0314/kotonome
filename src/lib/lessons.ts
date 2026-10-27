// 次の字: the way of 最初の16字, taken further (CONCEPT.md: 入口). Three short lessons, each a little at a time and
// practised many times right after each part (原則2), ending on words read with only what is known: the letters that
// breathe out hard or hold the throat tight (ㅋ ㅌ ㅍ ㅊ, ㄲ ㄸ ㅃ ㅆ ㅉ), the vowels that grow or join (ㅑ … ㅢ), and the
// letter under the vowel (パッチム). Each new letter is shown beside the one it grew from (hangul.ts `from`). Taking a
// lesson meets its letters, so the rain passes them over; not taking it, they are met in the rain one at a time.
// The words of each part are in i18n/ja.ts (ja.next), keyed by `copy`. Pure, for the tests.

import { PATCHIM } from "./hangul.ts";

export type LessonStep =
  /** One or a few letters shown beside the ones they come from, with their sounds one after the other. */
  | { kind: "grow"; key: string; chs: string[] }
  /** Hear, press the letter; every letter `times` rounds. */
  | { kind: "practice"; key: string; letters: string[]; times: number }
  /** Hear, press the word among its group (산 삼 상). */
  | { kind: "words"; key: string; groups: string[][]; times: number }
  /** Words one letter apart, to hear side by side. */
  | { kind: "compare"; key: string; groups: string[][] }
  /** Something to see and hear: mouths and words with their sounds. */
  | { kind: "show"; key: string; mouths?: string[]; words: string[] }
  /** Letters coming apart and together in one square (김: ㄱ ㅣ ㅁ). */
  | { kind: "join"; key: string; syls: string[] }
  /** Words to read with only what is known now. */
  | { kind: "read"; key: string; words: string[] }
  | { kind: "end"; key: string };

export type Lesson = { id: LessonId; items: string[]; steps: LessonStep[] };
export type LessonId = "breath" | "vowels" | "patchim";

const grow = (key: string, ...chs: string[]): LessonStep => ({ kind: "grow", key, chs });
const practice = (key: string, letters: string[], times = 3): LessonStep => ({ kind: "practice", key, letters, times });

export const LESSONS: Lesson[] = [
  {
    id: "breath",
    items: [..."ㅋㅌㅍㅊㄲㄸㅃㅆㅉ"],
    steps: [
      // A stroke more: the breath out hard.
      grow("k", "ㅋ"),
      grow("t", "ㅌ"),
      practice("kt", [..."ㄱㅋㄷㅌ"]),
      grow("p", "ㅍ"),
      grow("ch", "ㅊ"),
      practice("pch", [..."ㅂㅍㅈㅊ"]),
      // The same letter twice: the throat held tight.
      grow("kk", "ㄲ"),
      grow("tt", "ㄸ"),
      practice("kktt", [..."ㄱㅋㄲㄷㅌㄸ"], 2),
      grow("pp", "ㅃ"),
      grow("jj", "ㅉ"),
      practice("ppjj", [..."ㅂㅍㅃㅈㅊㅉ"], 2),
      grow("ss", "ㅆ"),
      practice("ss", [..."ㅅㅆㅈㅊ"]),
      { kind: "compare", key: "compare", groups: [["자다", "차다", "짜다"], ["비", "피"], ["사다", "싸다"]] },
      { kind: "read", key: "read", words: ["커피", "토마토", "피자", "기차", "오빠", "토끼", "아저씨", "바쁘다"] },
      { kind: "end", key: "end" },
    ],
  },
  {
    id: "vowels",
    items: [..."ㅑㅕㅛㅠㅐㅔㅒㅖㅘㅝㅟㅢㅚㅙㅞ"],
    steps: [
      // A short stroke doubled: ヤ行.
      grow("ya", "ㅑ"),
      grow("yeo", "ㅕ"),
      practice("ya", [..."ㅏㅑㅓㅕ"]),
      grow("yo", "ㅛ"),
      grow("yu", "ㅠ"),
      practice("yo", [..."ㅗㅛㅜㅠ"]),
      // ㅣ added: エ.
      grow("e", "ㅐ", "ㅔ"),
      practice("e", [..."ㅏㅐㅓㅣ"]),
      grow("ye", "ㅒ", "ㅖ"),
      practice("ye", [..."ㅕㅖㅑㅐ"], 2),
      // Two vowels one after the other: ワ, ウォ, ウィ, ウイ, ウェ.
      grow("wa", "ㅘ", "ㅝ"),
      practice("wa", [..."ㅗㅏㅘㅜㅝ"], 2),
      grow("wi", "ㅟ", "ㅢ"),
      practice("wi", [..."ㅜㅟㅡㅢㅣ"], 2),
      grow("we", "ㅚ", "ㅙ", "ㅞ"),
      practice("we", [..."ㅗㅚㅘㅟ"], 2),
      { kind: "read", key: "read", words: ["우유", "야구", "요리", "여기", "노래", "사과", "의자", "돼지"] },
      { kind: "end", key: "end" },
    ],
  },
  {
    id: "patchim",
    items: [PATCHIM],
    steps: [
      { kind: "join", key: "under", syls: ["김", "산"] },
      { kind: "show", key: "n", mouths: ["ㄴ", "ㅁ", "ㅇ"], words: ["산", "삼", "상"] },
      { kind: "words", key: "n", groups: [["산", "삼", "상"]], times: 3 },
      { kind: "show", key: "t", mouths: ["ㄱ", "ㄴ", "ㅁ"], words: ["박", "곧", "밥"] },
      { kind: "words", key: "t", groups: [["박", "밥", "방"]], times: 3 },
      { kind: "show", key: "l", mouths: ["ㄴ"], words: ["달", "물"] },
      { kind: "words", key: "all", groups: [["간", "감", "강"], ["반", "밤", "방"]], times: 2 },
      { kind: "show", key: "other", words: ["옷", "낮"] },
      { kind: "read", key: "read", words: ["김", "한국", "사랑", "물", "가방", "우산", "시간", "일본"] },
      { kind: "end", key: "end" },
    ],
  },
];

export const LESSON = new Map(LESSONS.map((l) => [l.id, l]));
export const LESSON_IDS = LESSONS.map((l) => l.id);
