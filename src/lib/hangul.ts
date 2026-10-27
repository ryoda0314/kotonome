// Hangul: syllables into letters and back, what each letter sounds like, and the order the letters are met in
// (CONCEPT.md: 最初に16字 → 出会いながら). Pure; imported by the app, the tests and the scripts (so its own imports
// carry .ts).

export const CHO = [..."ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ"];
export const JUNG = [..."ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ"];
export const JONG = ["", ..."ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ"];

export type Role = "cho" | "jung" | "jong";

export type Letter = {
  ch: string;
  kind: "cons" | "vowel";
  /** A hand-hold from Japanese: the row of kana or the vowel, never a reading of a word. */
  anchor: string;
  /** How the mouth does it, said plainly. */
  how?: string;
  /** What its shape is, for the sheet that opens when it is met (答え合わせ, never taught first). */
  shape: string;
  /**
   * The letter it grew from (ㄴ → ㄷ: a stroke more in the same place), or the two it is typed and written as
   * (ㅗ ㅏ → ㅘ): shown in 答え合わせ, so a new letter is met beside one already known.
   */
  from?: string[];
  rom: string;
};

const C = (ch: string, anchor: string, shape: string, rom: string, how?: string, from?: string): Letter => ({
  ch, kind: "cons", anchor, shape, rom, how, from: from ? [from] : undefined,
});
const V = (ch: string, anchor: string, shape: string, rom: string, how?: string, from?: string): Letter => ({
  ch, kind: "vowel", anchor, shape, rom, how, from: from ? [...from] : undefined,
});

const TIGHT = "のどを締めて、息を出さずに";

export const LETTERS: Letter[] = [
  C("ㄱ", "カ行", "カ行で、舌の奥が上がった形（横から見て）", "k/g", "語の途中ではガ行に近く"),
  C("ㄴ", "ナ行", "ナ行で、舌の先が歯ぐきについた形（横から見て）", "n"),
  C("ㄷ", "タ行", "ㄴ に線が1本。ナの場所で舌をはじくと、タ", "t/d", "語の途中ではダ行に近く", "ㄴ"),
  C("ㄹ", "ラ行", "ひらがなの「ら」に似た形（ラーメンのラ）", "r/l", "パッチムでは舌の先を上につけたまま、l"),
  C("ㅁ", "マ行", "閉じた口の形（正面から見て）", "m"),
  C("ㅂ", "パ行", "ㅁ の両側が上に伸びた形。閉じた口をはじけさせると、パ", "p/b", "語の途中ではバ行に近く", "ㅁ"),
  C("ㅅ", "サ行", "とがった歯の形", "s"),
  C("ㅇ", "音なし", "まるいのどの形", "—", "最初は音なし。パッチムでは ng"),
  C("ㅈ", "チャ行", "ㅅ に線が1本", "ch/j", "語の途中ではジャ行に近く", "ㅅ"),
  C("ㅎ", "ハ行", "ㅇ に線を足した形。のどから息を出す", "h", undefined, "ㅇ"),
  C("ㅋ", "カ行", "ㄱ に線が1本", "kʰ", "息を強く出す", "ㄱ"),
  C("ㅌ", "タ行", "ㄷ に線が1本", "tʰ", "息を強く出す", "ㄷ"),
  C("ㅍ", "パ行", "ㅂ を横に寝かせた形", "pʰ", "息を強く出す", "ㅂ"),
  C("ㅊ", "チャ行", "ㅈ に線が1本", "chʰ", "息を強く出す", "ㅈ"),
  C("ㄲ", "ッカ", "ㄱ が2つ", "kk", TIGHT, "ㄱ"),
  C("ㄸ", "ッタ", "ㄷ が2つ", "tt", TIGHT, "ㄷ"),
  C("ㅃ", "ッパ", "ㅂ が2つ", "pp", TIGHT, "ㅂ"),
  C("ㅆ", "ッサ", "ㅅ が2つ", "ss", "のどを締めて", "ㅅ"),
  C("ㅉ", "ッチャ", "ㅈ が2つ", "jj", TIGHT, "ㅈ"),
  V("ㅏ", "ア", "ㅣ の右に短い線", "a"),
  V("ㅓ", "オ", "ㅣ の左に短い線", "eo", "口を大きく開けたオ"),
  V("ㅗ", "オ", "ㅡ の上に短い線", "o", "口をすぼめたオ"),
  V("ㅜ", "ウ", "ㅡ の下に短い線", "u", "口をすぼめたウ"),
  V("ㅡ", "ウ", "横の線1本", "eu", "口を横に引いたウ"),
  V("ㅣ", "イ", "縦の線1本（アルファベットの i）", "i"),
  V("ㅑ", "ヤ", "ㅏ の短い線が2本", "ya", undefined, "ㅏ"),
  V("ㅕ", "ヨ", "ㅓ の短い線が2本", "yeo", "口を大きく開けたヨ", "ㅓ"),
  V("ㅛ", "ヨ", "ㅗ の短い線が2本", "yo", "口をすぼめたヨ", "ㅗ"),
  V("ㅠ", "ユ", "ㅜ の短い線が2本", "yu", undefined, "ㅜ"),
  V("ㅐ", "エ", "ㅏ と ㅣ", "ae", undefined, "ㅏㅣ"),
  V("ㅔ", "エ", "ㅓ と ㅣ", "e", "いまは ㅐ とほぼ同じ音", "ㅓㅣ"),
  V("ㅒ", "イェ", "ㅑ と ㅣ", "yae", undefined, "ㅑㅣ"),
  V("ㅖ", "イェ", "ㅕ と ㅣ", "ye", undefined, "ㅕㅣ"),
  V("ㅘ", "ワ", "ㅗ と ㅏ", "wa", undefined, "ㅗㅏ"),
  V("ㅙ", "ウェ", "ㅗ と ㅐ", "wae", undefined, "ㅗㅐ"),
  V("ㅚ", "ウェ", "ㅗ と ㅣ", "oe", undefined, "ㅗㅣ"),
  V("ㅝ", "ウォ", "ㅜ と ㅓ", "wo", undefined, "ㅜㅓ"),
  V("ㅞ", "ウェ", "ㅜ と ㅔ", "we", undefined, "ㅜㅔ"),
  V("ㅟ", "ウィ", "ㅜ と ㅣ", "wi", undefined, "ㅜㅣ"),
  V("ㅢ", "ウイ", "ㅡ と ㅣ", "ui", undefined, "ㅡㅣ"),
];

export const LETTER = new Map(LETTERS.map((l) => [l.ch, l]));
export const letterOf = (ch: string): Letter | undefined => LETTER.get(ch);

/** What a closing consonant sounds like: one of seven (the sheet of パッチム shows them once it has been met). */
export const FINAL_SOUND: Record<string, string> = {
  "ㄱ": "ㄱ", "ㄲ": "ㄱ", "ㅋ": "ㄱ",
  "ㄴ": "ㄴ",
  "ㄷ": "ㄷ", "ㅅ": "ㄷ", "ㅆ": "ㄷ", "ㅈ": "ㄷ", "ㅊ": "ㄷ", "ㅌ": "ㄷ", "ㅎ": "ㄷ",
  "ㄹ": "ㄹ",
  "ㅁ": "ㅁ",
  "ㅂ": "ㅂ", "ㅍ": "ㅂ",
  "ㅇ": "ㅇ",
};

// ---------------------------------------------------------------- what is met, and in what order

/**
 * 最初の16字 (CONCEPT.md: 入口): the five consonants that are pictures of the mouth, the four grown from them
 * in the same place (ㄷ ㅂ ㅈ ㅎ, one pair at a time) and ㄹ, then the basic vowels by their sound; each practised many
 * times right after it is shown.
 */
export const FIRST_LETTERS = [..."ㄱㄴㅇㅁㅅㄷㅂㅈㅎㄹㅏㅓㅗㅜㅡㅣ"];

/** Two ways of reading, met as the letters are: a consonant under the vowel, and a word said otherwise than spelled. */
export const PATCHIM = "받침";
export const SAID = "발음";
export const isWay = (item: string) => item === PATCHIM || item === SAID;

/**
 * The order the rest are met in, one a rain: what opens the most everyday words first (tests/content.test.mjs checks
 * each opens words once those before it have been met). Met earlier by looking one up, it is simply passed over.
 */
export const MEET_ORDER = [
  PATCHIM, "ㅋ", "ㅍ", "ㅊ", "ㅌ", "ㅐ", "ㅔ", "ㅕ", "ㅛ", "ㅠ", "ㅑ", SAID,
  "ㄲ", "ㅆ", "ㄸ", "ㅃ", "ㅉ", "ㅘ", "ㅝ", "ㅟ", "ㅢ", "ㅚ", "ㅖ", "ㅙ", "ㅞ", "ㅒ",
];

/** Everything there is to meet: the first 16 letters, then the rest in their order. */
export const ALL_ITEMS = [...FIRST_LETTERS, ...MEET_ORDER];

// ---------------------------------------------------------------- syllables

export type Syllable = { cho: string; jung: string; jong: string };

export const isSyllable = (ch: string) => {
  const c = ch.codePointAt(0) ?? 0;
  return c >= 0xac00 && c <= 0xd7a3;
};

/** A letter on its own (the compatibility jamo, ㄱ to ㅣ). */
export const isJamo = (ch: string) => {
  const c = ch.codePointAt(0) ?? 0;
  return c >= 0x3131 && c <= 0x3163;
};

export function decompose(ch: string): Syllable {
  const s = (ch.codePointAt(0) ?? 0) - 0xac00;
  if (s < 0 || s >= 11172) throw new Error(`not a Hangul syllable: ${ch}`);
  return { cho: CHO[Math.floor(s / 588)], jung: JUNG[Math.floor((s % 588) / 28)], jong: JONG[s % 28] };
}

export function compose(cho: string, jung: string, jong = ""): string {
  const a = CHO.indexOf(cho);
  const b = JUNG.indexOf(jung);
  const c = JONG.indexOf(jong);
  if (a < 0 || b < 0 || c < 0) throw new Error(`cannot compose ${cho}${jung}${jong}`);
  return String.fromCodePoint(0xac00 + a * 588 + b * 28 + c);
}

/** A text's letters in reading order, with their places. Spaces and punctuation are skipped. */
export function lettersOf(text: string): { ch: string; role: Role; at: number }[] {
  const out: { ch: string; role: Role; at: number }[] = [];
  [...text].forEach((c, at) => {
    if (!isSyllable(c)) return;
    const s = decompose(c);
    out.push({ ch: s.cho, role: "cho", at }, { ch: s.jung, role: "jung", at });
    if (s.jong) out.push({ ch: s.jong, role: "jong", at });
  });
  return out;
}

/** The distinct letters a text holds. */
export const letterSet = (text: string) => [...new Set(lettersOf(text).map((l) => l.ch))];
export const hasFinal = (text: string) => lettersOf(text).some((l) => l.role === "jong");

/** The syllable a letter is heard in on its own: a consonant with ㅏ, a vowel after the silent ㅇ. */
export function soundOf(ch: string): string {
  const l = LETTER.get(ch);
  if (!l) return ch;
  return l.kind === "cons" ? compose(ch, "ㅏ") : compose("ㅇ", ch);
}

// ---------------------------------------------------------------- what a word asks of the reader

/** True when the way it is said differs only by closing consonants said as one of the seven (꽃 ［꼳］). */
function onlyFinalsSaid(ko: string, say: string): boolean {
  const a = [...ko].filter(isSyllable);
  const b = [...say].filter(isSyllable);
  if (a.length !== b.length) return false;
  return a.every((c, i) => {
    const x = decompose(c);
    const y = decompose(b[i]);
    const plain = (j: string) => (j ? (FINAL_SOUND[j] ?? j) : "");
    return x.cho === y.cho && x.jung === y.jung && plain(x.jong) === plain(y.jong);
  });
}

/**
 * What a text asks of the reader beyond 最初の16字: its letters not among them, パッチム when a consonant sits
 * under a vowel, and 発音 when it is said otherwise than spelled (beyond a closing consonant said as one of the seven).
 */
export function needsOf(word: { ko: string; say?: string }): string[] {
  const needs = new Set<string>();
  for (const l of lettersOf(word.ko)) {
    if (l.role === "jong") needs.add(PATCHIM);
    if (!FIRST_LETTERS.includes(l.ch)) needs.add(l.ch);
  }
  if (word.say && !onlyFinalsSaid(word.ko, word.say)) needs.add(SAID);
  return [...needs];
}

/** The syllables of a word said otherwise than spelled (as indexes), for lighting them. */
export function saidApart(ko: string, say: string): number[] {
  const a = [...ko];
  const b = [...say];
  return a.flatMap((c, i) => (b[i] && b[i] !== c ? [i] : []));
}

// ---------------------------------------------------------------- names for files

const RR_CHO: Record<string, string> = {
  "ㄱ": "g", "ㄲ": "kk", "ㄴ": "n", "ㄷ": "d", "ㄸ": "tt", "ㄹ": "r", "ㅁ": "m", "ㅂ": "b", "ㅃ": "pp", "ㅅ": "s",
  "ㅆ": "ss", "ㅇ": "", "ㅈ": "j", "ㅉ": "jj", "ㅊ": "ch", "ㅋ": "k", "ㅌ": "t", "ㅍ": "p", "ㅎ": "h",
};
const RR_JONG: Record<string, string> = {
  "ㄱ": "k", "ㄲ": "k", "ㄴ": "n", "ㄷ": "t", "ㄹ": "l", "ㅁ": "m", "ㅂ": "p", "ㅅ": "t", "ㅆ": "t", "ㅇ": "ng",
  "ㅈ": "t", "ㅊ": "t", "ㅋ": "k", "ㅌ": "t", "ㅍ": "p", "ㅎ": "t",
};

/** Letter by letter, Revised Romanization's tables without its sound rules: only for file names. */
export function romanize(text: string): string {
  return [...text]
    .filter(isSyllable)
    .map((c) => {
      const s = decompose(c);
      return RR_CHO[s.cho] + (LETTER.get(s.jung)?.rom ?? "") + (s.jong ? (RR_JONG[s.jong] ?? "") : "");
    })
    .join("");
}

/** A clip's stable name: the romanization and 4 hex of the text (FNV-1a), the same in the browser and the scripts. */
export function clipId(text: string): string {
  let h = 0x811c9dc5;
  for (const unit of new TextEncoder().encode(text)) {
    h ^= unit;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${romanize(text) || "x"}-${(h & 0xffff).toString(16).padStart(4, "0")}`;
}
