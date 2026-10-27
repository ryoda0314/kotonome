"use client";

// Letters drawn from our own strokes (src/lib/glyph.ts) in SVG. Consonants in ink, vowels in the accent, so the parts
// of a square can be told apart. Strokes can be written in their order (`draw`), and a shape that changes moves point
// for point: a stroke that stays the same stroke keeps its place in the picture and slides to where it now belongs (ㄱ
// moving into the left of 가 when ㅏ comes), and a stroke that was not there is written in, lit for a moment (the
// stroke that grows ㄷ out of ㄴ). The motion is driven here rather than by CSS `d`, which Safari does not animate.

import { useEffect, useState } from "react";
import {
  addedStrokes,
  CONSONANTS,
  letterStrokes,
  mapBox,
  syllableParts,
  syllablesOf,
  toPath,
  type Part,
  type Pt,
  type Stroke,
} from "@/lib/glyph";
import styles from "./Glyph.module.css";

export type Ink = { key: string; pts: Pt[]; color: string; width: number; dot?: boolean; lit?: boolean };

const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const MOVE_MS = 280;

type Frame = {
  sig: string;
  from: Map<string, Pt[]>;
  to: Map<string, Pt[]>;
  t: number;
  /** Keys drawn last time; a key not among them is new, and written in. */
  known: Set<string>;
  /** Keys written in by the last change, kept until their writing has finished. */
  fresh: Set<string>;
};

const signature = (items: Ink[]) => items.map((i) => `${i.key}:${i.pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(";")}`).join("|");
const toMap = (items: Ink[]) => new Map(items.map((i) => [i.key, i.pts]));
const lerpPts = (a: Pt[], b: Pt[], k: number): Pt[] => b.map((p, n): Pt => [a[n][0] + (p[0] - a[n][0]) * k, a[n][1] + (p[1] - a[n][1]) * k]);

/** Where everything is at a frame: part of the way from where it was to where it goes. */
function positions(f: Frame): Map<string, Pt[]> {
  const k = ease(f.t);
  const out = new Map<string, Pt[]>();
  for (const [key, pts] of f.to) {
    const a = f.from.get(key);
    out.set(key, a && a.length === pts.length && k < 1 ? lerpPts(a, pts, k) : pts);
  }
  return out;
}

/**
 * Follows a list of strokes: a key that was there before moves from where it was; a new key is fresh (written in).
 * Returns what to draw now. Everything is kept in state, so the frames are pure.
 */
export function useMorph(items: Ink[]): (Ink & { fresh: boolean })[] {
  const sig = signature(items);
  const [frame, setFrame] = useState<Frame>(() => ({
    sig,
    from: new Map(),
    to: toMap(items),
    t: 1,
    known: new Set(items.map((i) => i.key)),
    fresh: new Set(),
  }));

  // A new shape: everything sets off from where it stands now. State adjusted while rendering, as React's docs show
  // for state that follows a prop; the effect below only runs the frames.
  if (frame.sig !== sig) {
    setFrame({
      sig,
      from: positions(frame),
      to: toMap(items),
      t: 0,
      known: new Set(items.map((i) => i.key)),
      fresh: new Set(items.filter((i) => !frame.known.has(i.key)).map((i) => i.key)),
    });
  }

  useEffect(() => {
    let raf = 0;
    const still = reduced();
    const start = performance.now();
    const tick = (now: number) => {
      const x = still ? 1 : Math.min(1, (now - start) / MOVE_MS);
      setFrame((f) => (f.sig === sig && f.t !== x ? { ...f, t: x } : f));
      if (x < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const settle = window.setTimeout(() => setFrame((f) => (f.sig === sig && f.fresh.size ? { ...f, fresh: new Set() } : f)), 1700);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
    };
  }, [sig]);

  const k = frame.sig === sig ? ease(frame.t) : 0;
  return items.map((i) => {
    const a = frame.from.get(i.key);
    const pts = a && a.length === i.pts.length && k < 1 ? lerpPts(a, i.pts, k) : i.pts;
    return { ...i, pts, fresh: frame.fresh.has(i.key) };
  });
}

/** Draws strokes given in 0..100 units. `draw` writes the fresh ones in, in order. */
export function InkSvg({
  items,
  width,
  height,
  draw = true,
  label,
  className,
}: {
  items: (Ink & { fresh?: boolean })[];
  width: number;
  height: number;
  draw?: boolean;
  label?: string;
  className?: string;
}) {
  let order = 0;
  return (
    <svg
      viewBox={`-8 -8 ${width + 16} ${height + 16}`}
      className={`${styles.svg} ${className ?? ""}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ aspectRatio: `${width + 16} / ${height + 16}` }}
    >
      {items.map((i) => {
        const fresh = draw && i.fresh && !i.dot;
        const n = fresh ? order++ : 0;
        return (
          <path
            key={i.key}
            d={toPath(i.pts)}
            pathLength={1}
            className={[fresh ? styles.write : "", i.lit && i.fresh ? styles.lit : ""].join(" ")}
            style={
              {
                stroke: i.color,
                strokeWidth: i.width,
                "--i": n,
                "--c": i.color,
              } as React.CSSProperties
            }
          />
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------- letters, squares, words

const SIZE = 100;
const W = 7.6;
export const CONS = "var(--ink)";
export const VOWEL = "var(--accent)";
export const roleColor = (role: Part["role"]) => (role === "jung" ? VOWEL : CONS);

const scale = (strokes: Stroke[], x = 0, y = 0, s = SIZE): Pt[][] => mapBox(strokes, [x, y, x + s, y + s]);

/** One letter's strokes, in 0..100. `added` lights the strokes grown onto its plain letter (ㄷ's top bar over ㄴ). */
export function letterInk(ch: string, { added = false, prefix = ch, color }: { added?: boolean; prefix?: string; color?: string } = {}): Ink[] {
  const isCons = !!CONSONANTS[ch];
  const lit = added ? new Set(addedStrokes(ch)) : new Set<number>();
  return scale(letterStrokes(ch)).map((pts, i) => ({
    key: `${prefix}:${i}`,
    pts,
    color: lit.has(i) ? VOWEL : (color ?? (isCons ? CONS : VOWEL)),
    width: W,
  }));
}

/** Not looked at yet: a letter drawn faint beside the one being shown (the ㅏ of 가 while ㄱ is met). */
export const FAINT = "var(--faint)";

/**
 * A syllable's strokes in 0..100, parts coloured by role (or all one colour); `marked` parts in the accent, `faint`
 * letters faint.
 */
export function syllableInk(
  syl: string,
  {
    at = 0,
    color,
    prefix = `${at}`,
    marked,
    faint,
  }: { at?: number; color?: string; prefix?: string; marked?: ReadonlySet<string>; faint?: ReadonlySet<string> } = {},
): Ink[] {
  return syllableParts(syl).flatMap((p) =>
    scale(p.strokes, at, 0).map((pts, i) => ({
      key: `${prefix}:${p.role}:${p.ch}:${i}`,
      pts,
      color: faint?.has(p.ch) ? FAINT : marked?.has(p.role) ? VOWEL : (color ?? roleColor(p.role)),
      width: W,
    })),
  );
}

export const GAP = 14;

/**
 * A word as squares in a row, in 0..(100+gap)·n. `marks`: parts to light, as "syllable:role" ("1:cho"); `faint`:
 * letters drawn faint.
 */
export function wordInk(
  text: string,
  opts: { color?: string; marks?: ReadonlySet<string>; faint?: ReadonlySet<string> } = {},
): { items: Ink[]; width: number } {
  const syls = syllablesOf(text);
  const items = syls.flatMap((s, i) => {
    const marked = opts.marks ? new Set([...opts.marks].filter((m) => m.startsWith(`${i}:`)).map((m) => m.split(":")[1])) : undefined;
    return syllableInk(s, { at: i * (SIZE + GAP), prefix: `${i}`, color: opts.color, marked, faint: opts.faint });
  });
  return { items, width: Math.max(SIZE, syls.length * SIZE + (syls.length - 1) * GAP) };
}

/** A letter on its own. */
export function Letter({ ch, size = 64, added = false, draw = false, color, label }: { ch: string; size?: number; added?: boolean; draw?: boolean; color?: string; label?: string }) {
  const items = letterInk(ch, { added, color }).map((i) => ({ ...i, fresh: draw }));
  return (
    <span className={styles.box} style={{ width: size, height: size }}>
      <InkSvg items={items} width={SIZE} height={SIZE} draw={draw} label={label ?? ch} />
    </span>
  );
}

/**
 * A word drawn from strokes; `height` is the height of one square. `fit`: never wider than its container (a long word
 * in a narrow card gets smaller rather than running into the next).
 */
export function Word({
  text,
  height = 56,
  draw = false,
  color,
  label,
  fit = false,
  marks,
  faint,
}: {
  text: string;
  height?: number;
  draw?: boolean;
  color?: string;
  label?: string;
  fit?: boolean;
  marks?: ReadonlySet<string>;
  faint?: ReadonlySet<string>;
}) {
  const { items, width } = wordInk(text, { color, marks, faint });
  const natural = (height * (width + 16)) / (SIZE + 16);
  const style = fit ? { width: "100%", maxWidth: natural, aspectRatio: `${width + 16} / ${SIZE + 16}` } : { width: natural, height };
  return (
    <span className={styles.box} style={style}>
      <InkSvg items={items.map((i) => ({ ...i, fresh: draw }))} width={width} height={SIZE} draw={draw} label={label ?? text} />
    </span>
  );
}
