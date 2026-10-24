// 練習: right after something has been understood, it is practised many times (CONCEPT.md, 原則2): a sound is said and
// its letter (or word) is pressed, round after round, never the same one twice in a row; one missed comes once more a
// little later. Nothing is counted. Used by the 90 seconds' 思い出す and by 気づく after the 答え合わせ. Pure, for the
// tests; the order is a seeded shuffle, the same every time.

import { pairsFor } from "../content/pairs.ts";
import { WORD } from "../content/words.ts";
import { LETTER, PATCHIM, soundOf } from "./hangul.ts";
import { canRead } from "./record.ts";

/** One go: `say` is heard, `answer` is to be pressed among `choices` (letters or words). */
export type PracticeItem = { answer: string; say: string; choices: string[] };

function seeded(seed: number): () => number {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export const seedOf = (text: string) => [...text].reduce((h, c) => (h * 31 + (c.codePointAt(0) ?? 0)) % 2147483647, 7);

function shuffle<T>(xs: T[], rand: () => number): T[] {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** No item right after itself: a repeat is swapped with the nearest later item that differs from both sides. */
function spread<T>(xs: T[], key: (x: T) => string): T[] {
  const out = [...xs];
  for (let i = 1; i < out.length; i++) {
    if (key(out[i]) !== key(out[i - 1])) continue;
    const j = out.findIndex((x, k) => k > i && key(x) !== key(out[i - 1]) && (k + 1 >= out.length || key(out[i]) !== key(out[k + 1])));
    if (j > 0) [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** `items` in `times` shuffled rounds (an item listed twice comes twice a round), never the same twice in a row. */
export function rounds<T>(items: T[], times: number, seed: number, key: (x: T) => string = String): T[] {
  const rand = seeded(seed);
  const out: T[] = [];
  for (let r = 0; r < times; r++) out.push(...shuffle(items, rand));
  return spread(out, key);
}

/** A go missed: it comes once more, `gap` goes later (or last). */
export function again<T>(queue: T[], at: number, gap = 3): T[] {
  const out = [...queue];
  out.splice(Math.min(at + 1 + gap, out.length), 0, queue[at]);
  return out;
}

/** Letters said alike now (ㅐ and ㅔ …): never both among the choices, the ear cannot tell them. */
const SAME_SOUND = [["ㅐ", "ㅔ"], ["ㅒ", "ㅖ"], ["ㅙ", "ㅞ", "ㅚ"]];
export const sameSound = (a: string, b: string) => a === b || SAME_SOUND.some((g) => g.includes(a) && g.includes(b));

/** Letters to tell from it: what it grew from or is made of, the same row of kana, then other letters of its kind. */
export function rivalsOf(ch: string, known: ReadonlySet<string>, n = 3): string[] {
  const l = LETTER.get(ch);
  if (!l) return [];
  const kin = [...LETTER.values()].filter((x) => x.kind === l.kind && x.ch !== ch);
  const ordered = [
    ...(l.from ?? []),
    ...kin.filter((x) => x.anchor === l.anchor || x.from?.includes(ch) || l.from?.some((f) => x.from?.includes(f))).map((x) => x.ch),
    ...kin.map((x) => x.ch),
  ];
  const out: string[] = [];
  for (const x of ordered) {
    if (out.length === n) break;
    if (!known.has(x) || out.includes(x) || sameSound(x, ch) || out.some((o) => sameSound(o, x))) continue;
    out.push(x);
  }
  return out;
}

/** Letters to practise: each heard as its syllable (가, 아), every one of them `times` rounds over. */
export function letterPractice(letters: string[], times: number, seed = seedOf(letters.join(""))): PracticeItem[] {
  return rounds(letters, times, seed).map((ch) => ({ answer: ch, say: soundOf(ch), choices: letters }));
}

/**
 * Right after 気づく: the new letter among the letters it is told from, it twice to each of theirs, two rounds (10 goes
 * with three rivals). For パッチム: words told apart by the letter under the vowel (산/삼/상), each twice. For 発音
 * nothing: there is no letter to tell.
 */
export function practiceFor(fresh: string, known: ReadonlySet<string>): PracticeItem[] {
  const seed = seedOf(fresh);
  if (LETTER.has(fresh)) {
    const choices = rounds([fresh, ...rivalsOf(fresh, known)], 1, seed);
    if (choices.length < 2) return [];
    return rounds([fresh, ...choices], 2, seed).map((ch) => ({ answer: ch, say: soundOf(ch), choices }));
  }
  if (fresh === PATCHIM) {
    const withIt = new Set(known).add(PATCHIM);
    const groups = pairsFor(PATCHIM, (ko) => canRead(WORD.get(ko) ?? { ko }, withIt)).slice(0, 2);
    return rounds(
      groups.flatMap((g) => g.map((answer) => ({ answer, say: answer, choices: g }))),
      2,
      seed,
      (x) => x.answer,
    );
  }
  return [];
}
