"use client";

// A word to read: drawn in ink, the learner reads it first, then presses it — it is said, its vowels light in the accent
// (the parts of each square become visible), and its meaning and its letters show. A letter not met yet is marked; any
// letter opens its sheet, there and then (CONCEPT.md: 知らない字は押せばその場で分かる).

import { useState } from "react";
import { Word } from "@/components/Glyph";
import { useOpenLetter } from "@/components/LetterSheet";
import { say } from "@/components/sound";
import type { Word as W } from "@/content/words";
import { lettersOf, needsOf, PATCHIM, SAID } from "@/lib/hangul";
import { ja } from "@/lib/i18n/ja";
import styles from "./parts.module.css";

export function WordCard({
  word,
  known,
  onReveal,
  again = false,
  index = 0,
  height = 64,
}: {
  word: W;
  /** What the learner has met: the rest is marked. */
  known: ReadonlySet<string>;
  onReveal?: () => void;
  /** A word holding a letter that came back: marked in the again violet. */
  again?: boolean;
  index?: number;
  height?: number;
}) {
  const [open, setOpen] = useState(false);
  const openLetter = useOpenLetter();
  const letters = [...new Map(lettersOf(word.ko).map((l) => [l.ch, l])).values()];
  const ways = needsOf(word).filter((n) => (n === PATCHIM || n === SAID) && !known.has(n));
  return (
    <li className={styles.wordCard} data-open={open ? "" : undefined} data-again={again ? "" : undefined} style={{ animationDelay: `${index * 0.12}s` }}>
      <button
        type="button"
        className={styles.wordFace}
        onClick={() => {
          void say(word.ko, { key: `card:${word.ko}` });
          if (!open) {
            setOpen(true);
            onReveal?.();
          }
        }}
        aria-label={open ? `${word.ko} ${ja.common.hearAgain}` : `${word.ko}`}
      >
        <Word text={word.ko} height={height} color={open ? undefined : "var(--ink)"} fit />
      </button>
      {open ? (
        <div className={styles.wordBack}>
          <p className={styles.wordMeaning}>
            {word.ja}
            {word.say ? <span className={styles.said}>{ja.rain.said(word.say)}</span> : null}
          </p>
          <p className={styles.chips}>
            {letters.map((l) => (
              <button
                key={l.ch}
                type="button"
                className={`t-ko ${styles.chip}`}
                data-vowel={l.role === "jung" ? "" : undefined}
                data-new={known.has(l.ch) ? undefined : ""}
                onClick={() => openLetter(l.ch)}
              >
                {l.ch}
              </button>
            ))}
            {ways.map((n) => (
              <button key={n} type="button" className={`${styles.chip} ${styles.wayChip}`} data-new="" onClick={() => openLetter(n)}>
                {n === PATCHIM ? ja.letter.patchim.title : ja.letter.said.title}
              </button>
            ))}
          </p>
        </div>
      ) : null}
    </li>
  );
}
