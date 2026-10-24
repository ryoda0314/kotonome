import React from 'react';
import { toPath } from '../jamo';
import { clamp01 } from '../anim';

/**
 * 画面座標の線を描く。progress 0→1 で1画ずつ書き順どおりに現れる。
 * colors を渡すと線ごとに色を変えられる（足した線だけ黄色、など）。
 * 長さ0の破線は丸い線端だけ点として残るので、まだ始まっていない画は出力しない。
 */
export const Ink = ({ strokes, color = '#1F2933', colors, width = 18, progress = 1, opacity = 1, outline }) => {
  const n = strokes.length;
  const layer = (stroke, w, key) =>
    strokes.map((st, i) => {
      const p = clamp01(progress * n - i);
      if (p <= 0) return null;
      return (
        <path
          key={`${key}${i}`}
          d={toPath(st)}
          stroke={stroke ?? colors?.[i] ?? color}
          strokeWidth={w}
          pathLength={1}
          strokeDasharray={p >= 1 ? undefined : '1 1'}
          strokeDashoffset={p >= 1 ? undefined : 1 - p}
        />
      );
    });
  return (
    <g opacity={opacity} fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* 縁取り（暗い背景の上でも字が読めるように、下に太い白線を敷く） */}
      {outline ? layer(outline, width + 10, 'o') : null}
      {layer(undefined, width, 's')}
    </g>
  );
};

/** SVG の文字（中央揃え）。縁取りは paint-order で文字の外側にだけ付ける */
export const Text = ({ x, y, children, size = 40, color = '#1F2933', font, weight = 700, anchor = 'middle', outline, outlineWidth = 10, opacity = 1, ...rest }) => (
  <text
    x={x}
    y={y}
    fontSize={size}
    fill={color}
    fontFamily={font}
    fontWeight={weight}
    textAnchor={anchor}
    dominantBaseline="central"
    opacity={opacity}
    stroke={outline}
    strokeWidth={outline ? outlineWidth : undefined}
    strokeLinejoin="round"
    paintOrder="stroke"
    {...rest}
  >
    {children}
  </text>
);
