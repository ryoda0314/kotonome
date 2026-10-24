import React from 'react';
import { C } from '../theme';
import { lerp } from '../anim';
import { CONSONANTS, mapBox } from '../jamo';

// ── 発声器官の断面図（左向きの横顔）──────────────────────────────
// ローカル座標 600×600。円いレンズで切り抜いて見せる。
// 舌は同じ点数の多角形で持ち、姿勢（rest / k / n）の間を点ごとに補間して動かす。

export const TONGUE = {
  rest: [[150, 326], [150, 310], [170, 297], [215, 284], [275, 277], [335, 280], [385, 296], [418, 328], [430, 370], [432, 410], [428, 446], [380, 460], [300, 450], [215, 406], [166, 356]],
  // カ行: 舌の奥が盛り上がって軟口蓋（のどの入口の天井）をふさぐ
  k: [[150, 326], [152, 312], [172, 302], [215, 292], [268, 278], [322, 254], [372, 240], [414, 258], [432, 312], [434, 380], [428, 446], [380, 460], [300, 450], [215, 406], [166, 356]],
  // ナ行: 舌の先が上の歯ぐきにつく
  n: [[156, 318], [160, 266], [180, 254], [218, 268], [275, 279], [335, 281], [385, 296], [418, 328], [430, 370], [432, 410], [428, 446], [380, 460], [300, 450], [215, 406], [168, 354]],
};

// 断面図のどこをレンズの中心に置き、どこまで見せるか（ローカル座標）
const VIEW = { x: 300, y: 330, r: 320 };

// 赤い字を重ねる位置（ローカル座標の箱）。字の正規形をこの箱へ写すので、点の構造が字と同じになる
export const SIDE_OVERLAY = {
  'ㄱ': [232, 214, 444, 398],
  'ㄴ': [136, 250, 356, 338],
  'ㅇ': [406, 420, 514, 528],
};

/** 断面図のローカル座標 → 画面座標 */
export const sideToScreen = (strokes, cx, cy, r) =>
  strokes.map((st) => st.map(([x, y]) => [cx + ((x - VIEW.x) * r) / VIEW.r, cy + ((y - VIEW.y) * r) / VIEW.r]));

export const sideOverlay = (ch, cx, cy, r) => sideToScreen(mapBox(CONSONANTS[ch].strokes, SIDE_OVERLAY[ch]), cx, cy, r);

// Catmull-Rom を3次ベジェに直して閉じた滑らかな形にする
function smoothClosed(pts) {
  const n = pts.length;
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
}

const tonguePts = (a, b, t) => TONGUE[a].map((p, i) => [lerp(p[0], TONGUE[b][i][0], t), lerp(p[1], TONGUE[b][i][1], t)]);

const HEAD =
  'M720 -40 L720 700 L345 700 L345 640 C335 560 312 495 268 462 C228 448 182 446 155 425 C128 404 120 372 127 350 ' +
  'C131 336 129 326 121 319 C106 312 102 298 112 291 L118 288 C103 282 101 268 112 260 C121 252 124 242 121 234 ' +
  'C116 227 102 225 90 219 C70 211 66 191 82 178 C99 160 118 118 128 78 C134 46 140 16 150 -20 Z';

const CAVITY =
  'M116 289 L150 293 C164 264 194 242 240 233 C290 225 345 225 385 237 C405 243 420 253 428 268 ' +
  'Q433 298 421 311 Q441 302 449 252 L456 214 C470 210 486 224 487 252 L490 680 L436 680 L430 440 ' +
  'L380 452 L300 442 L218 398 L156 336 L148 300 Z';

export const SideMouth = ({ cx, cy, r = 290, from = 'rest', to = 'rest', t = 0, opacity = 1, children }) => {
  const scale = r / VIEW.r;
  const id = `lens${Math.round(cx)}${Math.round(cy)}`;
  return (
    <g opacity={opacity}>
      <defs>
        <clipPath id={id}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="#FFFFFF" />
      <g clipPath={`url(#${id})`}>
        <g transform={`translate(${cx - VIEW.x * scale} ${cy - VIEW.y * scale}) scale(${scale})`}>
          <path d={HEAD} fill={C.skin} stroke={C.skinLine} strokeWidth={4} strokeLinejoin="round" />
          <path d={CAVITY} fill={C.cavity} />
          {/* 上の歯・下の歯 */}
          <path d="M140 259 L157 262 L155 293 L146 297 Z" fill="#FFFFFF" stroke="#8A7A70" strokeWidth={2.5} strokeLinejoin="round" />
          <path d="M146 301 L156 299 L158 328 L143 330 Z" fill="#FFFFFF" stroke="#8A7A70" strokeWidth={2.5} strokeLinejoin="round" />
          <path d={smoothClosed(tonguePts(from, to, t))} fill={C.tongue} stroke={C.tongueLine} strokeWidth={4} />
          {/* 鼻の穴と目のあたり（横顔だと分かるための手がかり） */}
          <path d="M96 212 C108 208 118 210 124 214" fill="none" stroke={C.skinLine} strokeWidth={3} strokeLinecap="round" />
          <path d="M150 60 C170 54 190 56 204 64" fill="none" stroke="#3B3B3B" strokeWidth={5} strokeLinecap="round" />
        </g>
        {children}
      </g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.ink} strokeWidth={6} />
    </g>
  );
};

// ── 正面の顔（ㅁ＝閉じた口、ㅅ＝とがった歯）──────────────────────────
// ローカル座標 600×600
export const FACE_OVERLAY = {
  'ㅁ': [214, 352, 386, 452],
  'ㅅ': [252, 358, 348, 470],
};

export const faceOverlay = (ch, cx, cy, scale) =>
  mapBox(CONSONANTS[ch].strokes, FACE_OVERLAY[ch]).map((st) => st.map(([x, y]) => [cx + (x - 300) * scale, cy + (y - 300) * scale]));

export const FaceFront = ({ cx, cy, r = 290, mouth = 'closed', opacity = 1 }) => {
  const scale = r / 300;
  const teeth = [];
  if (mouth === 'teeth') {
    // 下の歯。先がとがって上を向く（∧ の並び）
    const xs = [214, 256, 300, 344, 386];
    for (const x of xs) teeth.push(`M${x - 23} 468 L${x} ${x === 300 ? 372 : 414} L${x + 23} 468 Z`);
  }
  return (
    <g opacity={opacity}>
      <circle cx={cx} cy={cy} r={r} fill="#FFFFFF" />
      <g transform={`translate(${cx - 300 * scale} ${cy - 300 * scale}) scale(${scale})`}>
        <ellipse cx={300} cy={318} rx={226} ry={238} fill={C.skin} stroke={C.skinLine} strokeWidth={4} />
        <path d="M74 300 C64 140 170 64 300 64 C430 64 536 140 526 300 C512 236 470 190 410 176 C380 214 330 220 300 196 C262 226 200 222 176 180 C120 200 90 240 74 300 Z" fill="#4A3B32" />
        <ellipse cx={212} cy={262} rx={16} ry={24} fill="#2B2B2B" />
        <ellipse cx={388} cy={262} rx={16} ry={24} fill="#2B2B2B" />
        <ellipse cx={160} cy={340} rx={34} ry={20} fill="#F7A9A8" opacity={0.6} />
        <ellipse cx={440} cy={340} rx={34} ry={20} fill="#F7A9A8" opacity={0.6} />
        {mouth === 'closed' ? (
          <g>
            <rect x={214} y={352} width={172} height={100} rx={34} fill="#E86A7A" stroke={C.tongueLine} strokeWidth={4} />
            <path d="M226 402 L374 402" stroke={C.tongueLine} strokeWidth={5} strokeLinecap="round" />
          </g>
        ) : (
          <g>
            <path d="M180 352 C224 334 376 334 420 352 C428 430 384 488 300 488 C216 488 172 430 180 352 Z" fill={C.cavity} stroke={C.tongueLine} strokeWidth={4} />
            {teeth.map((d, i) => (
              <path key={i} d={d} fill="#FFFFFF" stroke="#8A7A70" strokeWidth={2.5} strokeLinejoin="round" />
            ))}
          </g>
        )}
      </g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.ink} strokeWidth={6} />
    </g>
  );
};
