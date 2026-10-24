// What is typed in 打つ (CONCEPT.md: 自分の指で打つ), the way the author learned on 한컴타자연습:
//   자리연습  where the keys are, a row at a time: one letter after another, the key lit
//   単語      words the learner can read, those read in the rains and not typed yet first
//   短文      ことのあめ's sentences, those holding words the learner has read and the fewest letters not met yet
// Nothing is timed or counted. Pure, for the tests.

import { WORDS, type Word } from "../content/words.ts";
import { ROWS } from "./dubeol.ts";
import { lettersOf } from "./hangul.ts";
import { canRead, knownSet, owedLetters, unknownIn, type State } from "./record.ts";
import type { Sentence } from "./sentences.ts";

export type DrillId = "home" | "top" | "bottom" | "shift" | "all";

const row = (i: number) => ROWS[i].map((k) => k.jamo);
export const DRILLS: { id: DrillId; keys: string[] }[] = [
  { id: "home", keys: row(1) },
  { id: "top", keys: row(0) },
  { id: "bottom", keys: row(2) },
  { id: "shift", keys: ROWS.flat().flatMap((k) => (k.shifted ? [k.shifted] : [])) },
  { id: "all", keys: [...row(0), ...row(1), ...row(2)] },
];
export const DRILL = new Map(DRILLS.map((d) => [d.id, d]));
export const DRILL_LENGTH = 24;
export const WORDS_PER_ROUND = 8;
export const LINES_PER_ROUND = 4;

type Rand = () => number;

/** A round of 자리연습: every key of the row comes, in a shuffled order, never the same key twice in a row. */
export function drillSequence(keys: string[], rand: Rand, n = DRILL_LENGTH): string[] {
  const out: string[] = [];
  while (out.length < n) {
    const bag = [...keys];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    if (bag.length > 1 && bag[0] === out[out.length - 1]) bag.push(bag.shift() as string);
    out.push(...bag);
  }
  return out.slice(0, n);
}

const lastOf = (xs?: number[]) => (xs && xs.length ? xs[xs.length - 1] : 0);

/** Words to type: readable ones, read in a rain and not typed yet first, then those holding a letter owed. */
export function pickTypingWords(s: State, now: number, rand: Rand, n = WORDS_PER_ROUND): Word[] {
  const known = knownSet(s);
  const owed = new Set(owedLetters(s));
  return WORDS.filter((w) => canRead(w, known) && [...w.ko].length <= 4)
    .map((w) => {
      const log = s.words[w.ko];
      const read = log?.read.length ?? 0;
      const typed = log?.typed.length ?? 0;
      const owes = lettersOf(w.ko).filter((l) => owed.has(l.ch)).length;
      const days = typed ? Math.min(30, (now - lastOf(log?.typed)) / 86_400_000) : 30;
      return { w, score: (read && !typed ? 30 : 0) + owes * 20 + Math.min(read, 3) * 3 + days - typed * 2 + rand() * 8 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.w);
}

/** Sentences to type: those holding words the learner has read, with the fewest letters not met yet, not typed lately. */
export function pickTypingLines(all: Sentence[], s: State, now: number, rand: Rand, n = LINES_PER_ROUND): Sentence[] {
  const known = knownSet(s);
  return all
    .map((x) => {
      const unknown = unknownIn({ ko: x.ko }, known).length;
      const read = x.words.filter((w) => s.words[w]?.read.length).length;
      const typed = s.lines[x.ko]?.length ?? 0;
      const days = typed ? Math.min(30, (now - lastOf(s.lines[x.ko])) / 86_400_000) : 30;
      return { x, score: -unknown * 12 + read * 8 + days - typed * 3 - x.ko.length * 0.3 + rand() * 6 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((c) => c.x);
}
