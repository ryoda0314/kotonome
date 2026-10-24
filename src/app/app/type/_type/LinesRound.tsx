"use client";

// 短文: ことのあめ's sentences, typed and then heard in their own clip, as the author typed the sentences they found and
// listened to check "この綴りはこういう音になるのか". Those holding words the learner has read, with the fewest letters
// not met yet, come first; a dotted syllable opens its letter there and then.

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import page from "@/components/page.module.css";
import { TypeLine } from "@/components/TypeLine";
import SENTENCES from "@/content/sentences.json";
import { lettersOf } from "@/lib/hangul";
import { ja } from "@/lib/i18n/ja";
import { clearLetters, knownSet, mixLetters, typedLine } from "@/lib/record";
import type { Sentence } from "@/lib/sentences";
import { commit, getState, useRecord } from "@/lib/store";
import { pickTypingLines } from "@/lib/typing-core";
import styles from "./type.module.css";

const t = ja.type;

export function LinesRound() {
  const state = useRecord();
  const [lines, setLines] = useState<Sentence[] | null>(null);
  const [i, setI] = useState(0);
  const known = useMemo(() => (state ? knownSet(state) : new Set<string>()), [state]);

  const start = useCallback(() => {
    setLines(pickTypingLines(SENTENCES as Sentence[], getState(), Date.now(), Math.random));
    setI(0);
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(start, 0);
    return () => window.clearTimeout(timer);
  }, [start]);

  const done = !!lines && i >= lines.length;

  return (
    <div className={page.page}>
      <header className={page.bar}>
        <Link href="/app/type" className={page.iconLink} aria-label={ja.common.back}>
          <Icon name="back" size={22} />
        </Link>
        <h1 className={page.barTitle}>{t.lines}</h1>
        {lines && !done ? <span className={styles.count}>{ja.common.countOf(i + 1, lines.length)}</span> : null}
      </header>

      {!lines ? (
        <p className={page.skeleton}>{ja.common.loading}</p>
      ) : done ? (
        <section className={styles.end}>
          <p className={styles.endTitle}>{t.done}</p>
          <p className={styles.source}>{ja.rain.linesSource}</p>
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
        <div className={styles.round}>
          <TypeLine
            key={lines[i].ko}
            target={lines[i].ko}
            meaning={lines[i].ja}
            audio={lines[i].audio}
            view="line"
            known={known}
            onTyped={(r) => {
              const x = lines[i];
              commit((s) => {
                const now = Date.now();
                const next = r.mixed.length ? mixLetters(typedLine(s, x.ko, now), r.mixed, now) : typedLine(s, x.ko, now);
                return r.mixed.length ? next : clearLetters(next, lettersOf(x.ko).map((l) => l.ch), now);
              });
            }}
            onDone={() => setI(i + 1)}
          />
        </div>
      )}
    </div>
  );
}
