import type { CSSProperties } from "react";
import { Easing, interpolate } from "remotion";
import { keysFor, typeKeys, textOf, composing } from "../../src/lib/dubeol.ts";

export const FPS = 30;

/** 秒 → コマ。 */
export const f = (seconds: number) => Math.round(seconds * FPS);

// アプリの雨：上から降ってきて落ち着く（ことのあめ と同じ）。
export const FALL = Easing.bezier(0.2, 0.8, 0.3, 1);
export const SOFT = Easing.bezier(0.33, 0, 0.2, 1);

/** `start` から `dur` コマで 0 → 1。 */
export function prog(frame: number, start: number, dur: number, easing: (t: number) => number = FALL): number {
  if (dur <= 0) return frame >= start ? 1 : 0;
  return interpolate(frame, [start, start + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });
}

/** 上から降ってくる。 */
export function fall(frame: number, start: number, dist = 18, dur = f(0.55)): CSSProperties {
  const p = prog(frame, start, dur);
  return { opacity: p, transform: `translateY(${(1 - p) * -dist}px)` };
}

/** 下からせり上がる。 */
export function rise(frame: number, start: number, dist = 14, dur = f(0.6)): CSSProperties {
  const p = prog(frame, start, dur);
  return { opacity: p, transform: `translateY(${(1 - p) * dist}px)` };
}

/** 少し上がりながら、静かに消える。 */
export function leave(frame: number, start: number, dur = f(0.4), dist = 10): CSSProperties {
  const p = prog(frame, start, dur, SOFT);
  return { opacity: 1 - p, transform: `translateY(${p * -dist}px)` };
}

export const mix = (a: number, b: number, p: number) => a + (b - a) * p;

/** 色から色へ（どちらも #rrggbb）。 */
export function mixColor(a: string, b: string, p: number): string {
  const ca = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const cb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${ca.map((x, i) => Math.round(mix(x, cb[i], p))).join(",")})`;
}

// ---- 두벌식で打つ：アプリの dubeol.ts のとおり、キーを一つずつ押して音節に組み上がる ----------------------------

/** 一打ち：押したキー（"⌫" は一つ戻す）。 */
export type Press = { key: string; at: number };
export type Typing = { word: string; presses: Press[]; duration: number };

/**
 * 語を打つ。`slip`：その番目のキーで打ち間違え（`wrong` を押して、間を置いて ⌫、それから正しく）。`per`：一打ちのコマ数。
 */
export function typing(word: string, { per = 6, slip, wrong, wait = 18 }: { per?: number; slip?: number; wrong?: string; wait?: number } = {}): Typing {
  const plan = keysFor(word).map((s) => s.key);
  const presses: Press[] = [];
  let t = 0;
  plan.forEach((key, i) => {
    if (i === slip && wrong) {
      t += per;
      presses.push({ key: wrong, at: t });
      t += wait;
      presses.push({ key: "⌫", at: t });
      t += per + 4;
    } else t += per + (i % 3 === 2 ? 2 : 0);
    presses.push({ key, at: t });
  });
  return { word, presses, duration: t };
}

/** `frame`（打ちはじめからのコマ）までに押したキー（⌫ で戻したものは除く）。 */
export function keysAt(t: Typing, frame: number): string[] {
  const keys: string[] = [];
  for (const p of t.presses) {
    if (p.at > frame) break;
    if (p.key === "⌫") keys.pop();
    else keys.push(p.key);
  }
  return keys;
}

/** 打った字と、まだ組んでいる途中の音節。 */
export function typedText(keys: string[]) {
  const kb = typeKeys(keys);
  return { text: textOf(kb), making: composing(kb) };
}
