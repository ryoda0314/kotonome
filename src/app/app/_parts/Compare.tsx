"use client";

// 聞き比べる: words one letter apart side by side, each said when pressed, as often as wanted, until the difference is
// heard (the author's 딸기 and 달기). Nothing is asked and nothing is counted.

import { Word } from "@/components/Glyph";
import { say, usePlaying } from "@/components/sound";
import { WORD } from "@/content/words";
import { ja } from "@/lib/i18n/ja";
import styles from "./parts.module.css";

export function Compare({ groups, title = ja.rain.notice.compare }: { groups: string[][]; title?: string }) {
  const playing = usePlaying();
  if (!groups.length) return null;
  return (
    <div className={styles.compare}>
      <p className={styles.compareTitle}>{title}</p>
      <p className={styles.lead}>{ja.rain.notice.compareLead}</p>
      <ul className={styles.compareRows}>
        {groups.map((g) => (
          <li key={g.join("/")} className={styles.compareRow} style={{ gridTemplateColumns: `repeat(${g.length}, minmax(0, 1fr))` }}>
            {g.map((ko) => (
              <button
                key={ko}
                type="button"
                className={styles.compareWord}
                data-playing={playing === `cmp:${ko}` ? "" : undefined}
                onClick={() => void say(ko, { key: `cmp:${ko}` })}
                aria-label={`${ko} ${ja.common.hear}`}
              >
                <Word text={ko} height={40} fit />
                <span className={styles.compareMeaning}>{WORD.get(ko)?.ja}</span>
              </button>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}
