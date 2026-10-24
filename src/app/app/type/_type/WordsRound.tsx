"use client";

// 単語: a round of words the learner can read, said as each comes up, typed, said again (音で確かめる). The words read
// in the rains and not typed yet come first. Letters typed off the way come back in the rain.

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Word } from "@/components/Glyph";
import { Icon } from "@/components/Icon";
import page from "@/components/page.module.css";
import { Speak } from "@/components/Speak";
import { preload } from "@/components/sound";
import { TypeLine } from "@/components/TypeLine";
import type { Word as W } from "@/content/words";
import { lettersOf } from "@/lib/hangul";
import { ja } from "@/lib/i18n/ja";
import { clearLetters, mixLetters, typedWord } from "@/lib/record";
import { commit, getState } from "@/lib/store";
import { pickTypingWords } from "@/lib/typing-core";
import styles from "./type.module.css";

const t = ja.type;

export function WordsRound() {
  const [words, setWords] = useState<W[] | null>(null);
  const [i, setI] = useState(0);

  const start = useCallback(() => {
    const picked = pickTypingWords(getState(), Date.now(), Math.random);
    setWords(picked);
    setI(0);
    preload(picked.map((w) => w.ko));
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(start, 0);
    return () => window.clearTimeout(timer);
  }, [start]);

  const done = !!words && i >= words.length;

  return (
    <div className={page.page}>
      <header className={page.bar}>
        <Link href="/app/type" className={page.iconLink} aria-label={ja.common.back}>
          <Icon name="back" size={22} />
        </Link>
        <h1 className={page.barTitle}>{t.words}</h1>
        {words && !done ? <span className={styles.count}>{ja.common.countOf(i + 1, words.length)}</span> : null}
      </header>

      {!words ? (
        <p className={page.skeleton}>{ja.common.loading}</p>
      ) : done ? (
        <section className={styles.end}>
          <p className={styles.endTitle}>{t.done}</p>
          <p className={page.note}>{t.doneWords}</p>
          <ul className={styles.typedList}>
            {words.map((w) => (
              <li key={w.ko}>
                <Speak text={w.ko} label={`${w.ko} ${ja.common.hear}`} size="sm" id={`typed:${w.ko}`} />
                <Word text={w.ko} height={30} />
                <span className={styles.typedMeaning}>{w.ja}</span>
              </li>
            ))}
          </ul>
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
            key={`${words[i].ko}:${i}`}
            target={words[i].ko}
            meaning={words[i].ja}
            hearFirst
            auto
            onTyped={(r) => {
              const w = words[i];
              commit((s) => {
                const now = Date.now();
                const next = r.mixed.length ? mixLetters(typedWord(s, w.ko, now), r.mixed, now) : typedWord(s, w.ko, now);
                return r.mixed.length ? next : clearLetters(next, lettersOf(w.ko).map((l) => l.ch), now);
              });
            }}
            onDone={() => setI(i + 1)}
          />
        </div>
      )}
    </div>
  );
}
