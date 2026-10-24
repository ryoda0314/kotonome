// A letter beside the one it grew from (ㅁ → ㅂ, the strokes that grew lit) or the two it is made of (ㅗ ＋ ㅏ → ㅘ):
// a new letter is met next to letters already known. Shown in 答え合わせ and in the letter's sheet, never before.

import { Fragment } from "react";
import { LETTER } from "@/lib/hangul";
import { Letter } from "./Glyph";
import { Icon } from "./Icon";
import styles from "./Grown.module.css";

export function Grown({ ch, size = 44 }: { ch: string; size?: number }) {
  const l = LETTER.get(ch);
  if (!l?.from) return null;
  return (
    <span className={styles.grown}>
      {l.from.map((f, i) => (
        <Fragment key={f}>
          {i ? <span className={styles.plus}>＋</span> : null}
          <Letter ch={f} size={size} />
        </Fragment>
      ))}
      <Icon name="arrow" size={18} />
      <Letter ch={ch} size={size} added={l.kind === "cons"} draw />
    </span>
  );
}
