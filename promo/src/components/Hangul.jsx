import React from 'react';
import { Ink } from './Ink';
import { C, ROLE_COLOR } from '../theme';
import { CONSONANTS, blockParts, jamoStrokes, lerpStrokes, mapBox, place } from '../jamo';

/** 線幅は字の大きさに比例させる（小さい字が潰れないよう下限あり） */
export const strokeW = (size) => Math.max(5, size * 0.078);

/** 字母1つを、中心 (cx, cy)・一辺 size の正方形に */
export const jamoAt = (ch, cx, cy, size) => place(jamoStrokes(ch), cx - size / 2, cy - size / 2, size);

/**
 * 字母1つ。showAdd で「足した線」だけ addColor にする。
 */
export const Jamo = ({ ch, cx, cy, size, color = C.ink, showAdd = false, addColor = C.add, progress = 1, opacity = 1, width }) => {
  const strokes = jamoAt(ch, cx, cy, size);
  const add = CONSONANTS[ch]?.add ?? [];
  const colors = showAdd ? strokes.map((_, i) => (add.includes(i) ? addColor : color)) : undefined;
  return <Ink strokes={strokes} color={color} colors={colors} width={width ?? strokeW(size)} progress={progress} opacity={opacity} />;
};

/** 1音節の部品を、中心 (cx, cy)・一辺 size のブロックに置いた画面座標で返す */
export const syllableParts = (ch, cx, cy, size) =>
  blockParts(ch).map((p) => ({ ...p, strokes: mapBox(p.strokes, [cx - size / 2, cy - size / 2, cx + size / 2, cy + size / 2]) }));

/** 部品がバラバラのときの位置（字母を単独で並べた形）。syllableParts と同じ点の構造 */
export const looseParts = (ch, boxes) =>
  blockParts(ch).map((p, i) => {
    const [cx, cy, size] = boxes[i];
    const single = p.role === 'jung' ? jamoStrokes(p.ch) : CONSONANTS[p.ch].strokes;
    return { ...p, strokes: place(single, cx - size / 2, cy - size / 2, size) };
  });

/**
 * 1音節。colorize 0→1 で墨色から役割の色（子音青・母音赤・パッチム緑）へ。
 * dim に役割名を渡すとその部品を薄くする（ㅇ が「音なし」なのを見せる等）。
 */
export const Syllable = ({ ch, cx, cy, size, colorize = 0, progress = 1, opacity = 1, dim, only, color = C.ink }) => {
  const parts = syllableParts(ch, cx, cy, size);
  return (
    <g opacity={opacity}>
      {parts.map((p, i) => {
        if (only && !only.includes(p.role)) return null;
        const col = colorize > 0 ? mix(color, ROLE_COLOR[p.role], colorize) : color;
        return (
          <Ink
            key={i}
            strokes={p.strokes}
            color={col}
            width={strokeW(size)}
            progress={Math.max(0, Math.min(1, progress * parts.length - i))}
            opacity={dim === p.role ? 0.28 : 1}
          />
        );
      })}
    </g>
  );
};

/** バラバラ → 合体（t 0→1）。部品ごとの色を保ったまま点が移動する */
export const Assemble = ({ ch, loose, cx, cy, size, t, colors, widthFrom, widthTo }) => {
  const from = looseParts(ch, loose);
  const to = syllableParts(ch, cx, cy, size);
  const w = (widthFrom ?? strokeW(loose[0][2])) + ((widthTo ?? strokeW(size)) - (widthFrom ?? strokeW(loose[0][2]))) * t;
  return (
    <g>
      {from.map((p, i) => (
        <Ink key={i} strokes={lerpStrokes(p.strokes, to[i].strokes, t)} color={colors?.[p.role] ?? ROLE_COLOR[p.role]} width={w} />
      ))}
    </g>
  );
};

/** 単語（音節を横に並べる）。各音節の中心 x を返すユーティリティ付き */
export const wordCenters = (n, cx, size, gap) => {
  const total = n * size + (n - 1) * gap;
  return Array.from({ length: n }, (_, i) => cx - total / 2 + size / 2 + i * (size + gap));
};

// 16進カラーの線形補間
export function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (sh) => Math.round(((pa >> sh) & 255) + ((((pb >> sh) & 255) - ((pa >> sh) & 255)) * t));
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
}
