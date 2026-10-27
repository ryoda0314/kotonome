// Letters drawn from our own strokes, not a font: so a letter can be written stroke by stroke, the stroke added for
// more breath can be drawn in the accent, and a syllable's parts can move into their places in the square, point for
// point. The same shapes as the promotional film (promo/src/jamo.js).
//
// Coordinates: a 0..1 square, y downwards.
//   consonants — drawn in the whole square, then mapped into the place a syllable gives them (they may be squashed);
//   vowels — kept where they sit in a syllable square, each with the place it leaves for the first consonant (cho).

import { decompose, isSyllable } from "./hangul.ts";

export type Pt = [number, number];
export type Stroke = Pt[];
export type Box = [number, number, number, number]; // x0, y0, x1, y1

const circle = (cx: number, cy: number, rx: number, ry = rx, n = 44): Stroke => {
  // From the top, anticlockwise: the way ㅇ is written.
  const pts: Stroke = [];
  for (let i = 0; i <= n; i++) {
    const a = -Math.PI / 2 - (2 * Math.PI * i) / n;
    pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return pts;
};
const along = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const siot = (top: number): Stroke[] => {
  const apex: Pt = [0.5, top];
  const left: Pt = [0.13, 0.88];
  return [[apex, left], [along(apex, left, 0.36), [0.88, 0.88]]];
};

type Cons = { strokes: Stroke[]; add?: number[] };

/** Consonants in their own square. `add`: the strokes added for more breath (drawn in the accent when shown). */
export const CONSONANTS: Record<string, Cons> = {
  "ㄱ": { strokes: [[[0.14, 0.18], [0.82, 0.18], [0.82, 0.88]]] },
  // ㄴ, ㄷ and ㅌ share their strokes exactly (and ㄱ/ㅋ, ㅅ/ㅈ/ㅊ), so the stroke that grows one from another is the only
  // one written in (最初の16字: ㄴ → ㄷ).
  "ㄴ": { strokes: [[[0.18, 0.18], [0.18, 0.82], [0.88, 0.82]]] },
  "ㄷ": { strokes: [[[0.18, 0.18], [0.84, 0.18]], [[0.18, 0.18], [0.18, 0.82], [0.88, 0.82]]], add: [0] },
  "ㄹ": { strokes: [[[0.17, 0.14], [0.82, 0.14], [0.82, 0.48], [0.18, 0.48], [0.18, 0.84], [0.87, 0.84]]] },
  "ㅁ": { strokes: [[[0.18, 0.18], [0.18, 0.84]], [[0.18, 0.18], [0.82, 0.18], [0.82, 0.84]], [[0.18, 0.84], [0.82, 0.84]]] },
  // ㅁ with its two sides grown upwards: the horns are their own strokes, so only they take the accent.
  "ㅂ": {
    strokes: [
      [[0.2, 0.12], [0.2, 0.48]], [[0.2, 0.48], [0.2, 0.86]],
      [[0.8, 0.12], [0.8, 0.48]], [[0.8, 0.48], [0.8, 0.86]],
      [[0.2, 0.48], [0.8, 0.48]], [[0.2, 0.86], [0.8, 0.86]],
    ],
    add: [0, 2],
  },
  "ㅅ": { strokes: siot(0.18) },
  "ㅇ": { strokes: [circle(0.5, 0.5, 0.36)] },
  "ㅈ": { strokes: [[[0.16, 0.18], [0.84, 0.18]], ...siot(0.18)], add: [0] },
  "ㅊ": { strokes: [[[0.5, 0.0], [0.5, 0.09]], [[0.16, 0.18], [0.84, 0.18]], ...siot(0.18)], add: [0] },
  "ㅋ": { strokes: [[[0.14, 0.18], [0.82, 0.18], [0.82, 0.88]], [[0.14, 0.52], [0.82, 0.52]]], add: [1] },
  "ㅌ": { strokes: [[[0.18, 0.18], [0.84, 0.18]], [[0.18, 0.5], [0.8, 0.5]], [[0.18, 0.18], [0.18, 0.82], [0.88, 0.82]]], add: [1] },
  // ㅂ laid on its side: its whole shape changes, so all of it is the new part.
  "ㅍ": {
    strokes: [[[0.12, 0.18], [0.88, 0.18]], [[0.36, 0.2], [0.36, 0.82]], [[0.64, 0.2], [0.64, 0.82]], [[0.1, 0.84], [0.9, 0.84]]],
    add: [0, 1, 2, 3],
  },
  "ㅎ": { strokes: [[[0.38, 0.05], [0.62, 0.05]], [[0.14, 0.22], [0.86, 0.22]], circle(0.5, 0.62, 0.27, 0.25)], add: [0, 1] },
};
// A double is the same letter twice, each squeezed into half the square.
for (const [d, s] of [["ㄲ", "ㄱ"], ["ㄸ", "ㄷ"], ["ㅃ", "ㅂ"], ["ㅆ", "ㅅ"], ["ㅉ", "ㅈ"]] as const) {
  const half = (x0: number) => CONSONANTS[s].strokes.map((st) => st.map(([x, y]): Pt => [x0 + x * 0.5, y]));
  CONSONANTS[d] = { strokes: [...half(0), ...half(0.5)] };
}

const v = (x: number, y0 = 0.04, y1 = 0.96): Stroke => [[x, y0], [x, y1]];
const h = (y: number, x0: number, x1: number): Stroke => [[x0, y], [x1, y]];

type Vowel = { type: "V" | "H" | "M"; cho: Box; strokes: Stroke[] };

/** Vowels where they sit in a syllable. The order of strokes is the order of the parts: ㅗ＋ㅏ is ㅘ stroke for stroke. */
export const VOWELS: Record<string, Vowel> = {
  // tall: the consonant goes on the left
  "ㅏ": { type: "V", cho: [0.06, 0.14, 0.6, 0.86], strokes: [v(0.72), h(0.48, 0.72, 0.94)] },
  "ㅐ": { type: "V", cho: [0.05, 0.14, 0.5, 0.86], strokes: [v(0.62, 0.06, 0.94), h(0.48, 0.62, 0.84), v(0.86, 0.02, 0.98)] },
  "ㅑ": { type: "V", cho: [0.06, 0.14, 0.6, 0.86], strokes: [v(0.72), h(0.37, 0.72, 0.94), h(0.6, 0.72, 0.94)] },
  "ㅒ": { type: "V", cho: [0.05, 0.14, 0.5, 0.86], strokes: [v(0.62, 0.06, 0.94), h(0.37, 0.62, 0.84), h(0.6, 0.62, 0.84), v(0.86, 0.02, 0.98)] },
  "ㅓ": { type: "V", cho: [0.04, 0.14, 0.56, 0.86], strokes: [h(0.48, 0.62, 0.82), v(0.84)] },
  "ㅔ": { type: "V", cho: [0.03, 0.14, 0.46, 0.86], strokes: [h(0.48, 0.52, 0.68), v(0.68, 0.06, 0.94), v(0.9, 0.02, 0.98)] },
  "ㅕ": { type: "V", cho: [0.04, 0.14, 0.56, 0.86], strokes: [h(0.37, 0.62, 0.82), h(0.6, 0.62, 0.82), v(0.84)] },
  "ㅖ": { type: "V", cho: [0.03, 0.14, 0.46, 0.86], strokes: [h(0.37, 0.52, 0.68), h(0.6, 0.52, 0.68), v(0.68, 0.06, 0.94), v(0.9, 0.02, 0.98)] },
  "ㅣ": { type: "V", cho: [0.08, 0.14, 0.62, 0.86], strokes: [v(0.78)] },
  // wide: the consonant goes on top
  "ㅗ": { type: "H", cho: [0.2, 0.04, 0.8, 0.52], strokes: [v(0.5, 0.56, 0.74), h(0.74, 0.06, 0.94)] },
  "ㅛ": { type: "H", cho: [0.2, 0.04, 0.8, 0.52], strokes: [v(0.36, 0.56, 0.74), v(0.64, 0.56, 0.74), h(0.74, 0.06, 0.94)] },
  "ㅜ": { type: "H", cho: [0.2, 0.04, 0.8, 0.5], strokes: [h(0.6, 0.06, 0.94), v(0.5, 0.6, 0.92)] },
  "ㅠ": { type: "H", cho: [0.2, 0.04, 0.8, 0.5], strokes: [h(0.6, 0.06, 0.94), v(0.36, 0.6, 0.92), v(0.64, 0.6, 0.92)] },
  "ㅡ": { type: "H", cho: [0.2, 0.06, 0.8, 0.56], strokes: [h(0.7, 0.06, 0.94)] },
  // wide and tall: the consonant goes top left
  "ㅘ": { type: "M", cho: [0.05, 0.04, 0.6, 0.46], strokes: [v(0.32, 0.5, 0.7), h(0.7, 0.04, 0.62), v(0.76, 0.02, 0.98), h(0.46, 0.76, 0.95)] },
  "ㅙ": { type: "M", cho: [0.04, 0.04, 0.5, 0.46], strokes: [v(0.27, 0.5, 0.7), h(0.7, 0.03, 0.54), v(0.66, 0.04, 0.96), h(0.46, 0.66, 0.85), v(0.88, 0.02, 0.98)] },
  "ㅚ": { type: "M", cho: [0.05, 0.04, 0.6, 0.46], strokes: [v(0.32, 0.5, 0.7), h(0.7, 0.04, 0.64), v(0.8, 0.02, 0.98)] },
  "ㅝ": { type: "M", cho: [0.05, 0.04, 0.6, 0.44], strokes: [h(0.56, 0.04, 0.62), v(0.33, 0.56, 0.9), h(0.4, 0.64, 0.78), v(0.8, 0.02, 0.98)] },
  "ㅞ": { type: "M", cho: [0.04, 0.04, 0.5, 0.44], strokes: [h(0.56, 0.03, 0.52), v(0.28, 0.56, 0.9), h(0.4, 0.55, 0.68), v(0.68, 0.06, 0.94), v(0.9, 0.02, 0.98)] },
  "ㅟ": { type: "M", cho: [0.05, 0.04, 0.6, 0.44], strokes: [h(0.56, 0.04, 0.64), v(0.34, 0.56, 0.9), v(0.8, 0.02, 0.98)] },
  "ㅢ": { type: "M", cho: [0.05, 0.06, 0.6, 0.5], strokes: [h(0.68, 0.04, 0.64), v(0.8, 0.02, 0.98)] },
};

// ---------------------------------------------------------------- geometry

export const mapBox = (strokes: Stroke[], [x0, y0, x1, y1]: Box): Stroke[] =>
  strokes.map((st) => st.map(([x, y]): Pt => [x0 + x * (x1 - x0), y0 + y * (y1 - y0)]));

const squashY = (strokes: Stroke[], k: number): Stroke[] => strokes.map((st) => st.map(([x, y]): Pt => [x, y * k]));
const squashBox = ([x0, y0, x1, y1]: Box, k: number): Box => [x0, y0 * k, x1, y1 * k];

export function bbox(strokes: Stroke[]): Box {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const st of strokes)
    for (const [x, y] of st) {
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
  return [x0, y0, x1, y1];
}

/** Into a box with the shape's own proportions kept, centred (a vowel shown on its own). */
export function fit(strokes: Stroke[], [bx, by, bw, bh]: [number, number, number, number]): Stroke[] {
  const [x0, y0, x1, y1] = bbox(strokes);
  const w = Math.max(x1 - x0, 1e-6), hh = Math.max(y1 - y0, 1e-6);
  const s = Math.min(bw / w, bh / hh);
  const ox = bx + (bw - w * s) / 2 - x0 * s;
  const oy = by + (bh - hh * s) / 2 - y0 * s;
  return strokes.map((st) => st.map(([x, y]): Pt => [ox + x * s, oy + y * s]));
}

export const lerpStrokes = (a: Stroke[], b: Stroke[], t: number): Stroke[] =>
  a.map((st, i) => st.map(([x, y], j): Pt => [x + (b[i][j][0] - x) * t, y + (b[i][j][1] - y) * t]));

/** True when two shapes can be interpolated point for point. */
export const sameShape = (a: Stroke[], b: Stroke[]) => a.length === b.length && a.every((s, i) => s.length === b[i].length);

// ---------------------------------------------------------------- letters and syllables

const FINAL_SPLIT = 0.6; // with a closing consonant, the top part is squeezed to this share of the height
const FINAL_BOX: Box = [0.16, 0.66, 0.84, 0.97];

export type Part = { role: "cho" | "jung" | "jong"; ch: string; strokes: Stroke[] };

/** One letter on its own, in a 0..1 square: a consonant as it is, a vowel cut out of its place and centred. */
export function letterStrokes(ch: string): Stroke[] {
  if (CONSONANTS[ch]) return CONSONANTS[ch].strokes;
  if (VOWELS[ch]) return fit(VOWELS[ch].strokes, [0.06, 0.06, 0.88, 0.88]);
  throw new Error(`no strokes for ${ch}`);
}

/** Which strokes of a consonant were added for breath (empty for the five shapes, ㄹ, vowels). */
export const addedStrokes = (ch: string): number[] => CONSONANTS[ch]?.add ?? [];

/** A syllable's parts in a 0..1 square. */
export function syllableParts(syllable: string): Part[] {
  const { cho, jung, jong } = decompose(syllable);
  return blockParts(cho, jung, jong);
}

/** cho + jung (+ jong) in a 0..1 square. */
export function blockParts(cho: string, jung: string, jong = ""): Part[] {
  const V = VOWELS[jung];
  const k = jong ? FINAL_SPLIT : 1;
  const parts: Part[] = [
    { role: "cho", ch: cho, strokes: mapBox(CONSONANTS[cho].strokes, squashBox(V.cho, k)) },
    { role: "jung", ch: jung, strokes: squashY(V.strokes, k) },
  ];
  if (jong) parts.push({ role: "jong", ch: jong, strokes: mapBox(CONSONANTS[jong].strokes, FINAL_BOX) });
  return parts;
}

/** Text into syllable squares: anything that is not a syllable is left out. */
export const syllablesOf = (text: string) => [...text].filter(isSyllable);

export function toPath(st: Stroke, scale = 1, dx = 0, dy = 0): string {
  return st.map(([x, y], i) => `${i ? "L" : "M"}${(dx + x * scale).toFixed(2)} ${(dy + y * scale).toFixed(2)}`).join("");
}
