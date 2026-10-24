"use client";

// A Korean sentence as text, ready to be met letter by letter: a syllable holding something not met yet is dotted
// underneath and opens that letter's sheet when pressed (CONCEPT.md: 知らない字は押せばその場で分かる). The word the
// sentence was chosen for can stand out in the accent.

import { isSyllable, needsOf } from "@/lib/hangul";
import { pieceOf } from "@/lib/sentences";
import { useOpenLetter } from "./LetterSheet";
import styles from "./KoText.module.css";

/** What a syllable holds that has not been met: letters first, then パッチム. */
export function unknownOf(syllable: string, known: ReadonlySet<string>): string[] {
  if (!isSyllable(syllable)) return [];
  return needsOf({ ko: syllable })
    .filter((n) => !known.has(n))
    .sort((a, b) => a.length - b.length);
}

export function KoText({ text, known, word, className }: { text: string; known?: ReadonlySet<string>; word?: string; className?: string }) {
  const openLetter = useOpenLetter();
  const target = word ? pieceOf(text, word) : -1;
  let piece = -1;
  return (
    <span className={`t-ko ${className ?? ""}`} lang="ko">
      {text.split(/(\s+)/).map((p, i) => {
        if (/^\s+$/.test(p) || !p) return <span key={i}>{p}</span>;
        piece++;
        const lit = piece === target ? [...(word ?? "")].length : 0;
        return (
          <span key={i}>
            {[...p].map((c, j) => {
              const unknown = known ? unknownOf(c, known) : [];
              const cls = j < lit ? styles.word : undefined;
              if (!unknown.length) return <span key={j} className={cls}>{c}</span>;
              return (
                <button
                  key={j}
                  type="button"
                  className={[styles.unknown, cls ?? ""].join(" ")}
                  onClick={() => openLetter(unknown[0], { among: unknown })}
                  aria-label={`${c}：${unknown.join(" ")}`}
                >
                  {c}
                </button>
              );
            })}
          </span>
        );
      })}
    </span>
  );
}
