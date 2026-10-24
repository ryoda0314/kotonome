// The learner's record: when they saw the 90 seconds, the letters they met and mixed up, the words they read and
// typed, the sentences they typed, the rounds of key practice, and the rains. Only what happened is kept (as times);
// everything shown is worked out from it.
// Pure; kept on the device by store.ts and in the account by sync.ts, merged and never overwritten (mergeStates).

import { FIRST_LETTERS, needsOf } from "./hangul.ts";

export type Stamps = number[];
/** A letter, or one of the two ways of reading (받침, 발음): when it was met, mixed up, and heard right again. */
export type LetterLog = { met?: number; mixed: Stamps; cleared?: number };
export type WordLog = { read: Stamps; typed: Stamps };
/** One rain of 浴びる, for looking back. */
export type RainEntry = { at: number; words: string[]; met: string[]; mixed: string[]; typed: string[] };

export type State = {
  v: 2;
  /** When the 90 seconds were seen (or passed over). */
  first?: number;
  letters: Record<string, LetterLog>;
  words: Record<string, WordLog>;
  /** ことのあめ's sentences typed in 打つ. */
  lines: Record<string, Stamps>;
  /** Rounds of 자리연습, by row. */
  drills: Record<string, Stamps>;
  rains: RainEntry[];
};

export const emptyState = (): State => ({ v: 2, letters: {}, words: {}, lines: {}, drills: {}, rains: [] });

/** A mixed-up letter comes back after this long, or after this many other rains, whichever comes first. */
export const RETURN_MS = 20 * 60 * 60 * 1000;
export const RETURN_RAINS = 2;
const STAMPS_KEPT = 12;
const RAINS_KEPT = 200;

const last = (s: Stamps | undefined) => (s && s.length ? s[s.length - 1] : 0);
const keepLast = (s: Stamps) => (s.length > STAMPS_KEPT ? s.slice(-STAMPS_KEPT) : s);
const add = (s: Stamps | undefined, at: number) => keepLast([...(s ?? []), at]);

/** Days are Japan days (as the sisters'): 2026-10-22. */
export function dayOf(at: number): string {
  return new Date(at + 9 * 3600_000).toISOString().slice(0, 10);
}

// ---------------------------------------------------------------- what can be read

/** What the learner has: the 90 seconds' letters, and everything met since (letters and ways of reading). */
export function knownSet(s: State): Set<string> {
  const out = new Set(FIRST_LETTERS);
  for (const [ch, log] of Object.entries(s.letters)) if (log.met) out.add(ch);
  return out;
}

export const canRead = (word: { ko: string; say?: string }, known: ReadonlySet<string>) => needsOf(word).every((n) => known.has(n));

/** What a text holds that the learner has not met yet. */
export const unknownIn = (word: { ko: string; say?: string }, known: ReadonlySet<string>) => needsOf(word).filter((n) => !known.has(n));

// ---------------------------------------------------------------- coming back

export const isOwed = (s: State, ch: string) => last(s.letters[ch]?.mixed) > (s.letters[ch]?.cleared ?? 0);

/** Rains finished since a moment. */
const rainsSince = (s: State, at: number) => s.rains.filter((r) => r.at > at).length;

/** A letter mixed up and not yet typed right since, once its time has come. */
export function isDue(s: State, ch: string, now: number): boolean {
  if (!isOwed(s, ch)) return false;
  const at = last(s.letters[ch]?.mixed);
  return now - at >= RETURN_MS || rainsSince(s, at) >= RETURN_RAINS;
}

export const owedLetters = (s: State) => Object.keys(s.letters).filter((ch) => isOwed(s, ch));
export const dueLetters = (s: State, now: number) => Object.keys(s.letters).filter((ch) => isDue(s, ch, now));

/** Letters met in the last two rains (not the 90 seconds'): they come again, in other words. */
export function freshLetters(s: State): string[] {
  const since = s.rains.length >= 2 ? s.rains[s.rains.length - 2].at : 0;
  return Object.entries(s.letters)
    .filter(([ch, log]) => log.met && log.met >= since && !FIRST_LETTERS.includes(ch))
    .map(([ch]) => ch);
}

// ---------------------------------------------------------------- what happened

/** The 90 seconds seen (or passed over): their letters are met. */
export function seeFirst(s: State, at: number): State {
  const next = s.first ? s : { ...s, first: at };
  return meetLetters(next, FIRST_LETTERS, at);
}

/** The first time each of these was met. */
export function meetLetters(s: State, letters: string[], at: number): State {
  const fresh = letters.filter((ch) => !s.letters[ch]?.met);
  if (!fresh.length) return s;
  const out = { ...s.letters };
  for (const ch of fresh) out[ch] = { ...(out[ch] ?? { mixed: [] }), met: at };
  return { ...s, letters: out };
}

export const readWord = (s: State, ko: string, at: number): State => ({
  ...s,
  words: { ...s.words, [ko]: { read: add(s.words[ko]?.read, at), typed: s.words[ko]?.typed ?? [] } },
});

export const typedWord = (s: State, ko: string, at: number): State => ({
  ...s,
  words: { ...s.words, [ko]: { read: s.words[ko]?.read ?? [], typed: add(s.words[ko]?.typed, at) } },
});

export const typedLine = (s: State, ko: string, at: number): State => ({ ...s, lines: { ...s.lines, [ko]: add(s.lines[ko], at) } });

export const finishDrill = (s: State, id: string, at: number): State => ({ ...s, drills: { ...s.drills, [id]: add(s.drills[id], at) } });

/** Letters mixed up: each is owed, and comes back. */
export function mixLetters(s: State, letters: string[], at: number): State {
  if (!letters.length) return s;
  const out = { ...s.letters };
  for (const ch of letters) out[ch] = { ...(out[ch] ?? { mixed: [] }), mixed: add(out[ch]?.mixed, at) };
  return { ...s, letters: out };
}

/** Letters typed right: an owed one is no longer owed. */
export function clearLetters(s: State, letters: string[], at: number): State {
  const owed = letters.filter((ch) => isOwed(s, ch));
  if (!owed.length) return s;
  const out = { ...s.letters };
  for (const ch of owed) out[ch] = { ...out[ch], cleared: at };
  return { ...s, letters: out };
}

export function finishRain(s: State, entry: RainEntry): State {
  if (s.rains.some((r) => r.at === entry.at)) return s;
  return { ...s, rains: [...s.rains, entry].slice(-RAINS_KEPT) };
}

// ---------------------------------------------------------------- two copies made one

const union = (a: Stamps = [], b: Stamps = []) => keepLast([...new Set([...a, ...b])].sort((x, y) => x - y));
const minOf = (a?: number, b?: number) => (a && b ? Math.min(a, b) : a || b);
const maxOf = (a?: number, b?: number) => (a && b ? Math.max(a, b) : a || b);

function mergeStamps(a: Record<string, Stamps>, b: Record<string, Stamps>): Record<string, Stamps> {
  const out: Record<string, Stamps> = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) out[k] = union(a[k], b[k]);
  return out;
}

/** The device's record and the account's, made one: nothing either has is lost. */
export function mergeStates(a: State, b: State): State {
  const letters: State["letters"] = {};
  for (const ch of new Set([...Object.keys(a.letters), ...Object.keys(b.letters)])) {
    const x = a.letters[ch];
    const y = b.letters[ch];
    const log: LetterLog = { mixed: union(x?.mixed, y?.mixed) };
    const met = minOf(x?.met, y?.met);
    const cleared = maxOf(x?.cleared, y?.cleared);
    if (met) log.met = met;
    if (cleared) log.cleared = cleared;
    letters[ch] = log;
  }
  const words: State["words"] = {};
  for (const ko of new Set([...Object.keys(a.words), ...Object.keys(b.words)])) {
    words[ko] = { read: union(a.words[ko]?.read, b.words[ko]?.read), typed: union(a.words[ko]?.typed, b.words[ko]?.typed) };
  }
  const byAt = new Map<number, RainEntry>();
  for (const r of [...a.rains, ...b.rains]) byAt.set(r.at, r);
  const rains = [...byAt.values()].sort((x, y) => x.at - y.at).slice(-RAINS_KEPT);
  const out: State = { v: 2, letters, words, lines: mergeStamps(a.lines, b.lines), drills: mergeStamps(a.drills, b.drills), rains };
  const first = minOf(a.first, b.first);
  return first ? { ...out, first } : out;
}

/** Kept small: the lists of times are capped as they grow, the rains too. */
export function bounded(s: State): State {
  return s.rains.length > RAINS_KEPT ? { ...s, rains: s.rains.slice(-RAINS_KEPT) } : s;
}

/**
 * A record read back from the device or the account: this shape, or nothing. A record from before the redesign (v1:
 * the eight steps) is left behind, and the learner starts again from the 90 seconds.
 */
export function revive(raw: unknown): State | null {
  const s = raw as Partial<State> | null;
  if (!s || s.v !== 2) return null;
  return { ...emptyState(), ...s, v: 2 };
}
