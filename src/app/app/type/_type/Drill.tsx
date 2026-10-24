"use client";

// 자리연습: one row of the keyboard, a letter at a time, its key lit and the finger named (한컴타자연습's first lessons).
// A wrong key shows what was pressed and waits; nothing is timed or counted. A round is 24 letters.

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Letter } from "@/components/Glyph";
import { Icon } from "@/components/Icon";
import { Keyboard } from "@/components/Keyboard";
import page from "@/components/page.module.css";
import { KEY_OF } from "@/lib/dubeol";
import { ja } from "@/lib/i18n/ja";
import { finishDrill } from "@/lib/record";
import { commit } from "@/lib/store";
import { DRILL, drillSequence, type DrillId } from "@/lib/typing-core";
import styles from "./type.module.css";

const t = ja.type;
const AHEAD = 6;

export function Drill({ id }: { id: DrillId }) {
  const keys = DRILL.get(id)?.keys ?? [];
  const [seq, setSeq] = useState<string[] | null>(null);
  const [i, setI] = useState(0);
  const [miss, setMiss] = useState<string | null>(null);

  const start = useCallback(() => {
    setSeq(drillSequence(DRILL.get(id)?.keys ?? [], Math.random));
    setI(0);
    setMiss(null);
  }, [id]);

  useEffect(() => {
    // Shuffled on the device.
    const timer = window.setTimeout(start, 0);
    return () => window.clearTimeout(timer);
  }, [start]);

  const done = !!seq && i >= seq.length;
  const now = seq && !done ? seq[i] : null;
  const key = now ? KEY_OF.get(now) : undefined;

  const onKey = (k: string) => {
    if (!seq || done) return;
    if (k !== seq[i]) {
      setMiss(k);
      return;
    }
    setMiss(null);
    setI(i + 1);
    if (i + 1 >= seq.length) commit((s) => finishDrill(s, id, Date.now()));
  };

  return (
    <div className={page.page}>
      <header className={page.bar}>
        <Link href="/app/type" className={page.iconLink} aria-label={ja.common.back}>
          <Icon name="back" size={22} />
        </Link>
        <h1 className={page.barTitle}>
          <span className={page.barSub}>{t.keys}</span>
          {t.drills[id].name}
        </h1>
        {seq ? <span className={styles.count}>{ja.common.countOf(Math.min(i + 1, seq.length), seq.length)}</span> : null}
      </header>

      {done ? (
        <section className={styles.end}>
          <p className={styles.endTitle}>{t.done}</p>
          <div className={page.actions}>
            <button type="button" className="btn" onClick={start}>
              {t.again}
            </button>
            <Link href="/app/type" className="btn-quiet">
              {t.toHub}
            </Link>
          </div>
        </section>
      ) : (
        <div className={styles.drill}>
          <div className={styles.now} aria-live="polite">
            {now ? <Letter key={`${i}:${now}`} ch={now} size={112} label={now} /> : null}
            <ol className={styles.ahead} aria-hidden="true">
              {(seq ?? []).slice(i + 1, i + 1 + AHEAD).map((ch, j) => (
                <li key={`${i + 1 + j}`} className="t-ko">
                  {ch}
                </li>
              ))}
            </ol>
          </div>
          <p className={styles.finger} data-miss={miss ? "" : undefined}>
            {miss ? (
              <>
                {t.pressed}
                <span className="t-ko">{miss}</span>
              </>
            ) : key ? (
              key.shift ? `${ja.typing.fingers[key.finger]}・${ja.typing.withShift}` : ja.typing.fingers[key.finger]
            ) : (
              t.pressLit
            )}
          </p>
          <Keyboard onKey={onKey} onBack={() => undefined} next={now} lit={new Set(keys)} />
        </div>
      )}
    </div>
  );
}
