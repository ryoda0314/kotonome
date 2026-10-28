// 字は、アプリと同じ自前の線で描く（../src/lib/glyph.ts の形をそのまま読み込む）。子音は墨、母音はアクセント。
// アプリでは CSS で書き順に描くところを、ここではコマで描く：`write` が 0 → 1 で、線が一本ずつ書かれる。
import { addedStrokes, CONSONANTS, letterStrokes, mapBox, syllableParts, syllablesOf, toPath, type Pt, type Stroke } from "../../src/lib/glyph.ts";
import { C } from "./theme";

const SIZE = 100;
const W = 7.6;
export const GAP = 14;

/** 一本の線。`p`：その線だけの書けた割合（無ければ全体の `write` から）。 */
type Ink = { key: string; pts: Pt[]; color: string; p?: number };
const scale = (strokes: Stroke[], x = 0): Pt[][] => mapBox(strokes, [x, 0, x + SIZE, SIZE]);

/** 線を描く。`write`：書けた割合（線の数で割って、一本ずつ）。 */
export function InkSvg({ items, width, write = 1 }: { items: Ink[]; width: number; write?: number }) {
  const n = items.length;
  return (
    <svg viewBox={`-8 -8 ${width + 16} ${SIZE + 16}`} style={{ display: "block", width: "100%", height: "100%", overflow: "visible" }}>
      {items.map((it, i) => {
        const p = it.p ?? Math.max(0, Math.min(1, write * n - i));
        if (p <= 0) return null;
        return (
          <path
            key={it.key}
            d={toPath(it.pts)}
            pathLength={1}
            fill="none"
            stroke={it.color}
            strokeWidth={W}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="1 1"
            strokeDashoffset={1 - p}
          />
        );
      })}
    </svg>
  );
}

/**
 * 一字。`added`：線を足した字（ㅋ の真ん中の横棒）を、その線だけアクセントで。`grow`：足した線だけを書く割合（ほかの線は
 * はじめから書いてある。ㄴ に線が足されて ㄷ になる）。
 */
export function Letter({ ch, size, color, write = 1, added = false, grow }: { ch: string; size: number; color?: string; write?: number; added?: boolean; grow?: number }) {
  const lit = added || grow !== undefined ? new Set(addedStrokes(ch)) : new Set<number>();
  const own = color ?? (CONSONANTS[ch] ? C.ink : C.accent);
  const items = scale(letterStrokes(ch)).map((pts, i) => ({ key: `${ch}:${i}`, pts, color: lit.has(i) ? C.accent : own, p: grow === undefined ? undefined : lit.has(i) ? grow : 1 }));
  return (
    <span style={{ display: "inline-flex", width: size, height: size, flexShrink: 0 }}>
      <InkSvg items={items} width={SIZE} write={write} />
    </span>
  );
}

/**
 * 語：四角を横に並べる。`ink`：全部墨（読む前のカード）。`marks`："音節:役割"（"0:cho"）の所をアクセントで。`dim`：同じ
 * 書き方の所を薄く（まだ出てこない字：나 の ㅏ）。`height`：四角ひとつの高さ。
 */
export function Word({
  text,
  height,
  ink = false,
  marks,
  dim,
  write = 1,
  color,
}: {
  text: string;
  height: number;
  ink?: boolean;
  marks?: ReadonlySet<string>;
  dim?: ReadonlySet<string>;
  write?: number;
  color?: string;
}) {
  const syls = syllablesOf(text);
  const items: Ink[] = syls.flatMap((s, i) =>
    syllableParts(s).flatMap((p) =>
      scale(p.strokes, i * (SIZE + GAP)).map((pts, k) => ({
        key: `${i}:${p.role}:${k}`,
        pts,
        color: dim?.has(`${i}:${p.role}`) ? C.line2 : marks?.has(`${i}:${p.role}`) ? C.accent : color ?? (ink || p.role !== "jung" ? C.ink : C.accent),
      })),
    ),
  );
  const width = Math.max(SIZE, syls.length * SIZE + (syls.length - 1) * GAP);
  return (
    <span style={{ display: "inline-flex", width: (height * (width + 16)) / (SIZE + 16), height, flexShrink: 0 }}>
      <InkSvg items={items} width={width} write={write} />
    </span>
  );
}

/** 一字の線を、別の四角に写したもの（口の絵の上に書くとき）。 */
export const strokesIn = (ch: string, box: [number, number, number, number]) => mapBox(CONSONANTS[ch]?.strokes ?? letterStrokes(ch), box);

/**
 * 字母が横一列に離れて並び、`p`（0 → 1）で語の四角へ組み上がる（라디오：ㄹ ㅏ ㄷ ㅣ ㅇ ㅗ → 라디오）。どの線も点の
 * 数が同じまま動くので、字は字のまま四角の中の場所へ滑る。高さは四角ひとつ分。
 */
export function JoinWord({ text, p, height, letterGap = 30 }: { text: string; p: number; height: number; letterGap?: number }) {
  const syls = syllablesOf(text);
  const parts = syls.flatMap((s, i) => syllableParts(s).map((part) => ({ ...part, syl: i })));
  const apartWidth = parts.length * SIZE + (parts.length - 1) * letterGap;
  const joinedWidth = syls.length * SIZE + (syls.length - 1) * GAP;
  const width = Math.max(apartWidth, joinedWidth);
  const joinedLeft = (width - joinedWidth) / 2;
  const apartLeft = (width - apartWidth) / 2;
  const k = 1 - Math.pow(1 - Math.max(0, Math.min(1, p)), 3);
  const items: Ink[] = parts.flatMap((part, n) => {
    const own = part.role === "jung" ? letterStrokes(part.ch) : CONSONANTS[part.ch].strokes;
    const apart = mapBox(own, [apartLeft + n * (SIZE + letterGap), 0, apartLeft + n * (SIZE + letterGap) + SIZE, SIZE]);
    const x = joinedLeft + part.syl * (SIZE + GAP);
    const joined = mapBox(part.strokes, [x, 0, x + SIZE, SIZE]);
    return apart.map((pts, i) => ({
      key: `${n}:${i}`,
      pts: pts.map((pt, j): Pt => [pt[0] + (joined[i][j][0] - pt[0]) * k, pt[1] + (joined[i][j][1] - pt[1]) * k]),
      color: part.role === "jung" ? C.accent : C.ink,
    }));
  });
  return (
    <span style={{ display: "inline-flex", width: (height * (width + 16)) / (SIZE + 16), height, flexShrink: 0 }}>
      <InkSvg items={items} width={width} />
    </span>
  );
}
