// What falls in a rain of 浴びる (CONCEPT.md: 浴びる → 気づく → 打ってみる → また出会う). Chosen on the device from the
// learner's own record:
//   はじめての字  one thing not met yet, in MEET_ORDER (none in the very first rain: that one is for reading at all)
//   浴びる        6 words: up to 3 that hold the new one, the rest readable already, words holding a letter that is
//                 due back first, then letters met in the last rains, then words never read; a little chance among
//                 equals so two rains are not alike. The first rain likes loanwords: read, and the meaning is there.
//   打ってみる    3 of this rain's words, the new one's first, then a due letter's, then the shorter
//   文の中で      up to 2 of ことのあめ's sentences holding this rain's words, those with the fewest letters not met yet
//                 (from the rain after パッチム: nearly every sentence has one)
// Pure, for the tests.

import { WORDS, type Word } from "../content/words.ts";
import { lettersOf, MEET_ORDER, needsOf, PATCHIM, SAID } from "./hangul.ts";
import { canRead, dueLetters, freshLetters, knownSet, unknownIn, type State } from "./record.ts";
import type { Sentence } from "./sentences.ts";
import { holds } from "./sentences.ts";

export const WORDS_PER_RAIN = 6;
export const NEW_PER_RAIN = 3;
export const TYPES_PER_RAIN = 3;
export const LINES_PER_RAIN = 2;
/** A sentence shown in a rain holds at most this many things not met yet (each can be looked up there). */
export const LINE_UNKNOWN_MAX = 3;

export type Line = { sentence: Sentence; word: string };
export type RainPlan = { at: number; fresh: string | null; words: Word[]; types: Word[]; lines: Line[]; due: string[] };

type Rand = () => number;

/** Every word the learner can read now. */
export function readableWords(s: State, known = knownSet(s)): Word[] {
  return WORDS.filter((w) => canRead(w, known));
}

/** The words that need `item` and nothing else not met yet. */
export function wordsOpenedBy(item: string, known: ReadonlySet<string>): Word[] {
  return WORDS.filter((w) => {
    const needs = needsOf(w);
    return needs.includes(item) && needs.every((n) => n === item || known.has(n));
  });
}

/** The next thing to meet: the first in MEET_ORDER not met yet that opens a word on its own. */
export function nextToMeet(known: ReadonlySet<string>): string | null {
  return MEET_ORDER.find((item) => !known.has(item) && wordsOpenedBy(item, known).length > 0) ?? null;
}

const lastOf = (xs?: number[]) => (xs && xs.length ? xs[xs.length - 1] : 0);
const syllables = (w: Word) => [...w.ko].length;

function take<T>(items: T[], score: (x: T) => number, n: number): T[] {
  return items
    .map((x) => ({ x, s: score(x) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map((x) => x.x);
}

/** `told`: words that ことのあめ's sentences hold, a little ahead once there are sentences to show. */
export function pickWords(s: State, now: number, rand: Rand, fresh: string | null, due: string[], told: ReadonlySet<string> = new Set()): Word[] {
  const known = knownSet(s);
  const dueSet = new Set(due);
  const recent = new Set(freshLetters(s));
  const firstRain = s.rains.length === 0;
  const neverRead = (w: Word) => !s.words[w.ko]?.read?.length;

  // The new one in its plainest words first: short, and said as written (낮 ［낟］ waits; 김 and 산 come first).
  const opened = fresh
    ? take(
        wordsOpenedBy(fresh, known),
        (w) => (neverRead(w) ? 10 : 0) + (told.has(w.ko) ? 4 : 0) - (w.say && fresh !== SAID ? 8 : 0) - syllables(w) * 2 + rand() * 6,
        NEW_PER_RAIN,
      )
    : [];
  const rest = take(
    readableWords(s, known),
    (w) => {
      const letters = new Set(lettersOf(w.ko).map((l) => l.ch));
      const owes = [...letters].filter((ch) => dueSet.has(ch)).length;
      const met = [...needsOf(w)].filter((n) => recent.has(n)).length;
      const days = neverRead(w) ? 30 : Math.min(30, (now - lastOf(s.words[w.ko]?.read)) / 86_400_000);
      return owes * 40 + met * 12 + (neverRead(w) ? 20 : 0) + days + (firstRain && w.kind === "loan" ? 15 : 0) + (told.has(w.ko) ? 8 : 0) + rand() * 6;
    },
    WORDS_PER_RAIN - opened.length,
  );
  // The new one's words spread among the others, not all in a row.
  const out: Word[] = [];
  for (let i = 0; out.length < opened.length + rest.length; i++) {
    if (rest[i]) out.push(rest[i]);
    if (opened[i]) out.push(opened[i]);
  }
  return out;
}

export function pickTypes(words: Word[], fresh: string | null, due: string[], rand: Rand, n = TYPES_PER_RAIN): Word[] {
  const dueSet = new Set(due);
  return take(
    words,
    (w) => {
      const holdsFresh = fresh ? needsOf(w).includes(fresh) : false;
      const owes = lettersOf(w.ko).filter((l) => dueSet.has(l.ch)).length;
      return (holdsFresh ? 30 : 0) + owes * 10 - Math.max(0, syllables(w) - 2) * 3 + rand() * 3;
    },
    n,
  );
}

/** For each word in turn, the sentence holding it with the fewest things not met yet (and then the shortest). */
export function pickLines(all: Sentence[], words: string[], known: ReadonlySet<string>, n = LINES_PER_RAIN): Line[] {
  const out: Line[] = [];
  for (const word of words) {
    const best = all
      .filter((x) => x.words.includes(word) && holds(x.ko, word) && !out.some((o) => o.sentence.ko === x.ko))
      .map((x) => ({ x, unknown: unknownIn({ ko: x.ko }, known).length }))
      .filter((c) => c.unknown <= LINE_UNKNOWN_MAX)
      .sort((a, b) => a.unknown - b.unknown || a.x.ko.length - b.x.ko.length)[0];
    if (best) out.push({ sentence: best.x, word });
    if (out.length === n) break;
  }
  return out;
}

export function planRain(s: State, now: number, sentences: Sentence[], rand: Rand = Math.random): RainPlan {
  const known = knownSet(s);
  const due = dueLetters(s, now);
  const fresh = s.rains.length ? nextToMeet(known) : null;
  // Sentences once the bottom letter has been met (the new one counts as met: it is met in this rain).
  const withFresh = new Set(known);
  if (fresh) withFresh.add(fresh);
  const told = withFresh.has(PATCHIM) ? new Set(sentences.flatMap((x) => x.words)) : new Set<string>();
  const words = pickWords(s, now, rand, fresh, due, told);
  const types = pickTypes(words, fresh, due, rand);
  const lines = told.size ? pickLines(sentences, [...types, ...words].map((w) => w.ko), withFresh) : [];
  return { at: now, fresh, words, types, lines, due };
}
