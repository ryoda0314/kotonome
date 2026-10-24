// ハングル字母を「線（折れ線）の集まり」として持つ。
//
// フォントを使わずに自前で線を持つのは、アニメーションのため:
//   ・1画ずつ描く（pathLength を使った描き順アニメ）
//   ・「線を1本足す」をその1本だけ色を変えて見せる
//   ・バラバラの字母がブロックの所定位置へ“同じ点のまま”移動して合体する
//
// 座標の約束
//   子音 … 0..1 の正方形に描いた正規形。ブロック内では領域へ写像する（縦横比は崩れてよい）
//   母音 … はじめから「ブロック（0..1 の正方形）の中での位置」で持つ。字母ごとに
//          初声の領域 cho も持たせる（母音の形で子音の置き場所が決まるため）

const circle = (cx, cy, rx, ry = rx, n = 44) => {
  // 上から反時計回り（ㅇ の書き順）
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = -Math.PI / 2 - (2 * Math.PI * i) / n;
    pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return pts;
};

const along = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

// ── 子音（正規形）────────────────────────────────────────
// add: 「画を足した」線の番号。基本字から派生した字で、その線だけ色を変えるのに使う
const SIOT = (top) => {
  const apex = [0.5, top];
  const left = [0.13, 0.88];
  return [[apex, left], [along(apex, left, 0.36), [0.88, 0.88]]];
};

export const CONSONANTS = {
  'ㄱ': { strokes: [[[0.14, 0.18], [0.82, 0.18], [0.82, 0.88]]] },
  'ㄴ': { strokes: [[[0.18, 0.12], [0.18, 0.82], [0.88, 0.82]]] },
  'ㄷ': { strokes: [[[0.18, 0.18], [0.84, 0.18]], [[0.18, 0.18], [0.18, 0.82], [0.88, 0.82]]], add: [0] },
  'ㄹ': { strokes: [[[0.17, 0.14], [0.82, 0.14], [0.82, 0.48], [0.18, 0.48], [0.18, 0.84], [0.87, 0.84]]] },
  'ㅁ': { strokes: [[[0.18, 0.18], [0.18, 0.84]], [[0.18, 0.18], [0.82, 0.18], [0.82, 0.84]], [[0.18, 0.84], [0.82, 0.84]]] },
  'ㅂ': {
    // ㅁ の上に縦棒が伸びた（＝角が2本生えた）。角だけ色を変えられるよう縦棒を上下に分けて持つ
    strokes: [
      [[0.2, 0.12], [0.2, 0.48]], [[0.2, 0.48], [0.2, 0.86]],
      [[0.8, 0.12], [0.8, 0.48]], [[0.8, 0.48], [0.8, 0.86]],
      [[0.2, 0.48], [0.8, 0.48]], [[0.2, 0.86], [0.8, 0.86]],
    ],
    add: [0, 2],
  },
  'ㅅ': { strokes: SIOT(0.12) },
  'ㅇ': { strokes: [circle(0.5, 0.5, 0.36)] },
  'ㅈ': { strokes: [[[0.16, 0.18], [0.84, 0.18]], ...SIOT(0.18)], add: [0] },
  'ㅊ': { strokes: [[[0.5, 0.02], [0.5, 0.16]], [[0.16, 0.28], [0.84, 0.28]], ...SIOT(0.28)], add: [0] },
  'ㅋ': { strokes: [[[0.14, 0.18], [0.82, 0.18], [0.82, 0.88]], [[0.14, 0.52], [0.82, 0.52]]], add: [1] },
  'ㅌ': { strokes: [[[0.18, 0.18], [0.84, 0.18]], [[0.18, 0.5], [0.8, 0.5]], [[0.18, 0.18], [0.18, 0.82], [0.88, 0.82]]], add: [1] },
  'ㅍ': {
    strokes: [[[0.12, 0.18], [0.88, 0.18]], [[0.36, 0.2], [0.36, 0.82]], [[0.64, 0.2], [0.64, 0.82]], [[0.1, 0.84], [0.9, 0.84]]],
    add: [0, 1, 2, 3], // ㅂ を横倒しにした形。形ごと変わる
  },
  'ㅎ': { strokes: [[[0.38, 0.05], [0.62, 0.05]], [[0.14, 0.22], [0.86, 0.22]], circle(0.5, 0.62, 0.27, 0.25)], add: [0, 1] },
};

// 双子（濃音）は同じ字を左右に半分ずつ詰める
for (const [d, s] of [['ㄲ', 'ㄱ'], ['ㄸ', 'ㄷ'], ['ㅃ', 'ㅂ'], ['ㅆ', 'ㅅ'], ['ㅉ', 'ㅈ']]) {
  const half = (x0) => CONSONANTS[s].strokes.map((st) => st.map(([x, y]) => [x0 + x * 0.5, y]));
  CONSONANTS[d] = { strokes: [...half(0.0), ...half(0.5)] };
}

// ── 母音（ブロック内の位置で持つ）────────────────────────────
const v = (x, y0 = 0.04, y1 = 0.96) => [[x, y0], [x, y1]];
const h = (y, x0, x1) => [[x0, y], [x1, y]];

export const VOWELS = {
  // 縦長（子音は左）
  'ㅏ': { type: 'V', cho: [0.06, 0.14, 0.6, 0.86], strokes: [v(0.72), h(0.48, 0.72, 0.94)] },
  'ㅐ': { type: 'V', cho: [0.05, 0.14, 0.5, 0.86], strokes: [v(0.62, 0.06, 0.94), h(0.48, 0.62, 0.84), v(0.86, 0.02, 0.98)] },
  'ㅑ': { type: 'V', cho: [0.06, 0.14, 0.6, 0.86], strokes: [v(0.72), h(0.37, 0.72, 0.94), h(0.6, 0.72, 0.94)] },
  'ㅒ': { type: 'V', cho: [0.05, 0.14, 0.5, 0.86], strokes: [v(0.62, 0.06, 0.94), h(0.37, 0.62, 0.84), h(0.6, 0.62, 0.84), v(0.86, 0.02, 0.98)] },
  'ㅓ': { type: 'V', cho: [0.04, 0.14, 0.56, 0.86], strokes: [h(0.48, 0.62, 0.82), v(0.84)] },
  'ㅔ': { type: 'V', cho: [0.03, 0.14, 0.46, 0.86], strokes: [h(0.48, 0.52, 0.68), v(0.68, 0.06, 0.94), v(0.9, 0.02, 0.98)] },
  'ㅕ': { type: 'V', cho: [0.04, 0.14, 0.56, 0.86], strokes: [h(0.37, 0.62, 0.82), h(0.6, 0.62, 0.82), v(0.84)] },
  'ㅖ': { type: 'V', cho: [0.03, 0.14, 0.46, 0.86], strokes: [h(0.37, 0.52, 0.68), h(0.6, 0.52, 0.68), v(0.68, 0.06, 0.94), v(0.9, 0.02, 0.98)] },
  'ㅣ': { type: 'V', cho: [0.08, 0.14, 0.62, 0.86], strokes: [v(0.78)] },
  // 横長（子音は上）
  'ㅗ': { type: 'H', cho: [0.2, 0.04, 0.8, 0.52], strokes: [v(0.5, 0.56, 0.74), h(0.74, 0.06, 0.94)] },
  'ㅛ': { type: 'H', cho: [0.2, 0.04, 0.8, 0.52], strokes: [v(0.36, 0.56, 0.74), v(0.64, 0.56, 0.74), h(0.74, 0.06, 0.94)] },
  'ㅜ': { type: 'H', cho: [0.2, 0.04, 0.8, 0.5], strokes: [h(0.6, 0.06, 0.94), v(0.5, 0.6, 0.92)] },
  'ㅠ': { type: 'H', cho: [0.2, 0.04, 0.8, 0.5], strokes: [h(0.6, 0.06, 0.94), v(0.36, 0.6, 0.92), v(0.64, 0.6, 0.92)] },
  'ㅡ': { type: 'H', cho: [0.2, 0.06, 0.8, 0.56], strokes: [h(0.7, 0.06, 0.94)] },
  // 横＋縦（子音は左上）
  'ㅘ': { type: 'M', cho: [0.05, 0.04, 0.6, 0.46], strokes: [v(0.32, 0.5, 0.7), h(0.7, 0.04, 0.62), v(0.76, 0.02, 0.98), h(0.46, 0.76, 0.95)] },
  'ㅙ': { type: 'M', cho: [0.04, 0.04, 0.5, 0.46], strokes: [v(0.27, 0.5, 0.7), h(0.7, 0.03, 0.54), v(0.66, 0.04, 0.96), h(0.46, 0.66, 0.85), v(0.88, 0.02, 0.98)] },
  'ㅚ': { type: 'M', cho: [0.05, 0.04, 0.6, 0.46], strokes: [v(0.32, 0.5, 0.7), h(0.7, 0.04, 0.64), v(0.8, 0.02, 0.98)] },
  'ㅝ': { type: 'M', cho: [0.05, 0.04, 0.6, 0.44], strokes: [h(0.56, 0.04, 0.62), v(0.33, 0.56, 0.9), h(0.4, 0.64, 0.78), v(0.8, 0.02, 0.98)] },
  'ㅞ': { type: 'M', cho: [0.04, 0.04, 0.5, 0.44], strokes: [h(0.56, 0.03, 0.52), v(0.28, 0.56, 0.9), h(0.4, 0.55, 0.68), v(0.68, 0.06, 0.94), v(0.9, 0.02, 0.98)] },
  'ㅟ': { type: 'M', cho: [0.05, 0.04, 0.6, 0.44], strokes: [h(0.56, 0.04, 0.64), v(0.34, 0.56, 0.9), v(0.8, 0.02, 0.98)] },
  'ㅢ': { type: 'M', cho: [0.05, 0.06, 0.6, 0.5], strokes: [h(0.68, 0.04, 0.64), v(0.8, 0.02, 0.98)] },
};

// ── 音節の分解 ─────────────────────────────────────────────
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
const JONG = ['', ...'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'];

export function decompose(syllable) {
  const s = syllable.codePointAt(0) - 0xac00;
  if (s < 0 || s >= 11172) throw new Error(`ハングル音節ではない: ${syllable}`);
  return [CHO[Math.floor(s / 588)], JUNG[Math.floor((s % 588) / 28)], JONG[s % 28]];
}

// ── 座標変換 ───────────────────────────────────────────────
export const mapBox = (strokes, [x0, y0, x1, y1]) =>
  strokes.map((st) => st.map(([x, y]) => [x0 + x * (x1 - x0), y0 + y * (y1 - y0)]));

const squashY = (strokes, k) => strokes.map((st) => st.map(([x, y]) => [x, y * k]));
const squashBox = ([x0, y0, x1, y1], k) => [x0, y0 * k, x1, y1 * k];

export function bbox(strokes) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const st of strokes) for (const [x, y] of st) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  return [x0, y0, x1, y1];
}

/** 縦横比を保ったまま box の中央に収める（単独で見せる母音用） */
export function fit(strokes, [bx, by, bw, bh]) {
  const [x0, y0, x1, y1] = bbox(strokes);
  const w = Math.max(x1 - x0, 1e-6), hgt = Math.max(y1 - y0, 1e-6);
  const s = Math.min(bw / w, bh / hgt);
  const ox = bx + (bw - w * s) / 2 - x0 * s;
  const oy = by + (bh - hgt * s) / 2 - y0 * s;
  return strokes.map((st) => st.map(([x, y]) => [ox + x * s, oy + y * s]));
}

/** 0..1 の正方形の字を、左上 (x,y)・一辺 size の正方形へ */
export const place = (strokes, x, y, size) => mapBox(strokes, [x, y, x + size, y + size]);

/** 同じ構造の線どうしを点ごとに補間（合体・変形アニメ） */
export const lerpStrokes = (a, b, t) =>
  a.map((st, i) => st.map(([x, y], j) => [x + (b[i][j][0] - x) * t, y + (b[i][j][1] - y) * t]));

// ── ブロック組み立て ─────────────────────────────────────────
const FINAL_SPLIT = 0.6; // パッチムがあるとき、上の部分を縦にこの割合へ縮める
const FINAL_BOX = [0.16, 0.66, 0.84, 0.97];

/**
 * 1音節を部品に分けて、ブロック（0..1）内の座標で返す。
 * @returns {{role:'cho'|'jung'|'jong', ch:string, strokes:number[][][]}[]}
 */
export function blockParts(syllable) {
  const [c, vw, f] = decompose(syllable);
  const V = VOWELS[vw];
  const k = f ? FINAL_SPLIT : 1;
  const parts = [
    { role: 'cho', ch: c, strokes: mapBox(CONSONANTS[c].strokes, squashBox(V.cho, k)) },
    { role: 'jung', ch: vw, strokes: squashY(V.strokes, k) },
  ];
  if (f) parts.push({ role: 'jong', ch: f, strokes: mapBox(CONSONANTS[f].strokes, FINAL_BOX) });
  return parts;
}

/** 単独表示用の字母の線（0..1）。子音は正規形、母音はブロック位置から切り出して中央へ */
export function jamoStrokes(ch) {
  if (CONSONANTS[ch]) return CONSONANTS[ch].strokes;
  if (VOWELS[ch]) return fit(VOWELS[ch].strokes, [0.06, 0.06, 0.88, 0.88]);
  throw new Error(`未定義の字母: ${ch}`);
}

export const isVowel = (ch) => !!VOWELS[ch];

export function toPath(st) {
  return st.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
}
