// The standard Korean keyboard, 두벌식 (KS X 5002): the one on Korean phones and computers, so what the fingers learn
// here is how they will type Korean anywhere (CONCEPT.md, 原則5: 自分の指で打つ). Consonants under the left hand,
// vowels under the right, the tight consonants and ㅒ ㅖ with Shift.
//
// What the keys make, as a Korean input method makes it: a consonant after a vowel closes the syllable, and a vowel
// after that takes the closing consonant along to start the next one (가 + ㄴ = 간, then ㅏ → 가나); two vowels in a
// row make one (ㅗ ㅏ → ㅘ), and so do two closing consonants (ㄹ ㄱ → ㄺ). Pure, for the tests.

import { compose, isJamo, isSyllable, decompose } from "./hangul.ts";

/** Which finger: left or right, pinky, ring, middle, index (the home row is ㅁ ㄴ ㅇ ㄹ and ㅓ ㅏ ㅣ). */
export type Finger = "lp" | "lr" | "lm" | "li" | "ri" | "rm" | "rr" | "rp";
export type KeyDef = { code: string; jamo: string; shifted?: string; finger: Finger };

const K = (code: string, jamo: string, finger: Finger, shifted?: string): KeyDef => ({ code, jamo, finger, shifted });

/** The three rows of letters, as on the keyboard (the codes are the keys' places, whatever is printed on them). */
export const ROWS: KeyDef[][] = [
  [
    K("KeyQ", "ㅂ", "lp", "ㅃ"), K("KeyW", "ㅈ", "lr", "ㅉ"), K("KeyE", "ㄷ", "lm", "ㄸ"), K("KeyR", "ㄱ", "li", "ㄲ"), K("KeyT", "ㅅ", "li", "ㅆ"),
    K("KeyY", "ㅛ", "ri"), K("KeyU", "ㅕ", "ri"), K("KeyI", "ㅑ", "rm"), K("KeyO", "ㅐ", "rr", "ㅒ"), K("KeyP", "ㅔ", "rp", "ㅖ"),
  ],
  [
    K("KeyA", "ㅁ", "lp"), K("KeyS", "ㄴ", "lr"), K("KeyD", "ㅇ", "lm"), K("KeyF", "ㄹ", "li"), K("KeyG", "ㅎ", "li"),
    K("KeyH", "ㅗ", "ri"), K("KeyJ", "ㅓ", "ri"), K("KeyK", "ㅏ", "rm"), K("KeyL", "ㅣ", "rr"),
  ],
  [
    K("KeyZ", "ㅋ", "lp"), K("KeyX", "ㅌ", "lr"), K("KeyC", "ㅊ", "lm"), K("KeyV", "ㅍ", "li"), K("KeyB", "ㅠ", "li"),
    K("KeyN", "ㅜ", "ri"), K("KeyM", "ㅡ", "ri"),
  ],
];

const KEYS = ROWS.flat();

/** Every letter that has a key of its own, with Shift where it needs it. */
export const KEY_OF = new Map<string, { code: string; shift: boolean; finger: Finger; face: string }>();
for (const k of KEYS) {
  KEY_OF.set(k.jamo, { code: k.code, shift: false, finger: k.finger, face: k.jamo });
  if (k.shifted) KEY_OF.set(k.shifted, { code: k.code, shift: true, finger: k.finger, face: k.jamo });
}

/** The letter a key makes (Shift on a key with nothing above it makes the same letter, as on a Korean keyboard). */
export function jamoOf(code: string, shift: boolean): string | undefined {
  const k = KEYS.find((x) => x.code === code);
  if (!k) return undefined;
  return shift && k.shifted ? k.shifted : k.jamo;
}

const CONSONANT_KEYS = new Set([..."ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ"]);
const VOWEL_KEYS = new Set([..."ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅛㅜㅠㅡㅣ"]);
export const isConsonantKey = (k: string) => CONSONANT_KEYS.has(k);
export const isVowelKey = (k: string) => VOWEL_KEYS.has(k);

/** Two vowels typed one after the other that make one. */
const JUNG_JOIN: Record<string, string> = { "ㅗㅏ": "ㅘ", "ㅗㅐ": "ㅙ", "ㅗㅣ": "ㅚ", "ㅜㅓ": "ㅝ", "ㅜㅔ": "ㅞ", "ㅜㅣ": "ㅟ", "ㅡㅣ": "ㅢ" };
/** Two closing consonants that make one. */
const JONG_JOIN: Record<string, string> = {
  "ㄱㅅ": "ㄳ", "ㄴㅈ": "ㄵ", "ㄴㅎ": "ㄶ", "ㄹㄱ": "ㄺ", "ㄹㅁ": "ㄻ", "ㄹㅂ": "ㄼ", "ㄹㅅ": "ㄽ", "ㄹㅌ": "ㄾ", "ㄹㅍ": "ㄿ", "ㄹㅎ": "ㅀ",
  "ㅂㅅ": "ㅄ",
};
/** A letter made of two keys, back into its keys (ㅘ → ㅗ ㅏ, ㄺ → ㄹ ㄱ). */
const SPLIT: Record<string, [string, string]> = Object.fromEntries(
  [...Object.entries(JUNG_JOIN), ...Object.entries(JONG_JOIN)].map(([pair, one]) => [one, [...pair] as [string, string]]),
);
/** The keys of one letter: its own key, or two (ㅘ is ㅗ then ㅏ). */
export const keysOfLetter = (letter: string): string[] => SPLIT[letter] ?? [letter];
/** ㄸ ㅃ ㅉ never close a syllable. */
const NO_JONG = new Set(["ㄸ", "ㅃ", "ㅉ"]);

// ---------------------------------------------------------------- typing

type Cur = { cho?: string; jung?: string; jong?: string };
type Snapshot = { done: string; cur: Cur | null; keys: string[] };
/** What has been typed: the text done, the syllable being made, and every key (to go back one at a time). */
export type Kb = Snapshot & { past: Snapshot[] };

export const emptyKb = (): Kb => ({ done: "", cur: null, keys: [], past: [] });

function render(c: Cur): string {
  if (c.cho && c.jung) return compose(c.cho, c.jung, c.jong ?? "");
  return c.cho ?? c.jung ?? "";
}

/** One key: a letter, or " " for the space bar. A key that makes nothing is ignored. */
export function press(kb: Kb, key: string): Kb {
  const before: Snapshot = { done: kb.done, cur: kb.cur, keys: kb.keys };
  let done = kb.done;
  let cur: Cur | null = kb.cur ? { ...kb.cur } : null;
  const flush = () => {
    if (cur) done += render(cur);
    cur = null;
  };

  if (key === " ") {
    flush();
    done += " ";
  } else if (isConsonantKey(key)) {
    if (cur?.cho && cur.jung && !cur.jong && !NO_JONG.has(key)) cur.jong = key;
    else if (cur?.jong && JONG_JOIN[cur.jong + key]) cur.jong = JONG_JOIN[cur.jong + key];
    else {
      flush();
      cur = { cho: key };
    }
  } else if (isVowelKey(key)) {
    if (cur?.jong) {
      // The closing consonant (or the second of two) opens the next syllable.
      const two = SPLIT[cur.jong];
      let moved: string;
      if (two) {
        cur.jong = two[0];
        moved = two[1];
      } else {
        moved = cur.jong;
        delete cur.jong;
      }
      flush();
      cur = { cho: moved, jung: key };
    } else if (cur?.jung && JUNG_JOIN[cur.jung + key]) {
      cur.jung = JUNG_JOIN[cur.jung + key];
    } else if (cur?.cho && !cur.jung) {
      cur.jung = key;
    } else {
      flush();
      cur = { jung: key };
    }
  } else return kb;

  return { done, cur, keys: [...kb.keys, key], past: [...kb.past, before] };
}

/** Back one key. */
export function back(kb: Kb): Kb {
  const prev = kb.past[kb.past.length - 1];
  return prev ? { ...prev, past: kb.past.slice(0, -1) } : kb;
}

/** What has been typed, as text. */
export const textOf = (kb: Kb) => kb.done + (kb.cur ? render(kb.cur) : "");
/** The syllable still being made (it may yet change), or "". */
export const composing = (kb: Kb) => (kb.cur ? render(kb.cur) : "");

/** Types keys from nothing. */
export const typeKeys = (keys: string[]) => keys.reduce(press, emptyKb());

// ---------------------------------------------------------------- the way to a text

/** Only what is typed: syllables, letters and single spaces (punctuation is shown, never typed). */
export function normalize(text: string): string {
  return [...text]
    .map((c) => (isSyllable(c) || isJamo(c) ? c : /\s/.test(c) ? " " : ""))
    .join("")
    .replace(/ +/g, " ")
    .trim();
}

/** One key on the way: the key, the letter it belongs to (ㅗ of ㅘ belongs to ㅘ), and where in the text. */
export type Step = { key: string; letter: string; at: number };

/** Every key of a text in order: the only way to type it on this keyboard. */
export function keysFor(text: string): Step[] {
  const out: Step[] = [];
  [...normalize(text)].forEach((c, at) => {
    if (c === " ") {
      out.push({ key: " ", letter: " ", at });
      return;
    }
    const letters = isSyllable(c) ? Object.values(decompose(c)).filter(Boolean) : [c];
    for (const letter of letters) for (const key of keysOfLetter(letter)) out.push({ key, letter, at });
  });
  return out;
}

export type Guide = {
  /** The next key on the way, or null once every key is in (or a key went off the way). */
  next: Step | null;
  /** Keys that went off the way: this many ⌫ first. */
  back: number;
  /** The key that should have come where it went off. */
  missed: Step | null;
  /** Keys on the way so far. */
  ok: number;
};

/** Compares the keys pressed with the way to `plan`. */
export function guide(kb: Kb, plan: Step[]): Guide {
  let ok = 0;
  while (ok < kb.keys.length && ok < plan.length && kb.keys[ok] === plan[ok].key) ok++;
  const back = kb.keys.length - ok;
  return { next: back ? null : (plan[ok] ?? null), back, missed: back ? (plan[ok] ?? null) : null, ok };
}

/** Every key of the way is in. */
export const isDone = (kb: Kb, plan: Step[]) => kb.keys.length === plan.length && guide(kb, plan).ok === plan.length;
