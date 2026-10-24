"use client";

// 文の中で: this rain's words inside sentences friends send each other (ことのあめ's, with their clips). Read the
// sentence, then press to hear it; the word stands out in the accent, a syllable holding a letter not met yet is dotted
// and opens it there and then (as the author looked up each new letter in the sentences they studied), and the
// Japanese is there when asked for.

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { KoText } from "@/components/KoText";
import { play, stop } from "@/components/player";
import { ja } from "@/lib/i18n/ja";
import type { Line } from "@/lib/rain-core";
import parts from "../_parts/parts.module.css";
import styles from "./rain.module.css";

export function Lines({ lines, known, onDone }: { lines: Line[]; known: ReadonlySet<string>; onDone: () => void }) {
  const [playing, setPlaying] = useState<number | null>(null);
  const [shown, setShown] = useState<Set<number>>(new Set());

  const hear = async (i: number) => {
    setPlaying(i);
    await play(lines[i].sentence.audio);
    setPlaying((p) => (p === i ? null : p));
  };

  useEffect(() => () => stop(), []);

  return (
    <>
      <p className={parts.lead}>{ja.rain.linesLead}</p>
      <ul className={styles.sentences}>
        {lines.map((f, i) => (
          <li key={f.sentence.ko} className={styles.sentence} style={{ animationDelay: `${i * 0.25}s` }}>
            <button
              type="button"
              className={styles.speak}
              data-playing={playing === i ? "" : undefined}
              onClick={() => void hear(i)}
              aria-label={`${f.sentence.ko} ${ja.common.hear}`}
            >
              <Icon name="speaker" />
            </button>
            <div>
              <p className={styles.ko}>
                <KoText text={f.sentence.ko} known={known} word={f.word} />
              </p>
              {shown.has(i) ? (
                <p className={styles.ja}>{f.sentence.ja}</p>
              ) : (
                <button type="button" className={styles.toggle} onClick={() => setShown(new Set([...shown, i]))}>
                  {ja.rain.showTranslation}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p className={styles.source}>{ja.rain.linesSource}</p>
      <div className={parts.actions}>
        <button type="button" className="btn" onClick={onDone}>
          {ja.common.next}
          <Icon name="arrow" size={18} />
        </button>
      </div>
    </>
  );
}
