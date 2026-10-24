import { Easing, interpolate, spring } from 'remotion';

export const FPS = 30;
export const sec = (s) => Math.round(s * FPS);
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp01 = (t) => Math.max(0, Math.min(1, t));

/** at から d フレームかけて 0→1（ease-out） */
export const ramp = (f, at, d = 9, easing = Easing.out(Easing.cubic)) =>
  interpolate(f, [at, at + d], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing });

/** 行き来する動き（ease-in-out） */
export const move = (f, at, d = 14) => ramp(f, at, d, Easing.inOut(Easing.cubic));

/** 弾んで出る（0→1、少し行き過ぎて戻る） */
export const pop = (f, at) =>
  f < at ? 0 : spring({ frame: f - at, fps: FPS, config: { damping: 10, stiffness: 170, mass: 0.6 } });

/** 出て、消える（at で出て、until で消える） */
export const life = (f, at, until = Infinity, d = 8) => Math.min(ramp(f, at, d), 1 - ramp(f, until - d, d));
