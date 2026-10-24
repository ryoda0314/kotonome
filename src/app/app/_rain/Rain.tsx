"use client";

// 浴びる: one rain at a time, chosen on the device from the learner's own record (rain-core.ts):
//   浴びる      six words fall; read each, then press it — its sound and meaning answer, its letters open there
//   気づく      when the rain brought something new: the words holding it side by side, then the 答え合わせ
//   打ってみる  three of the words are said; type them on the 두벌식 keyboard, and hear them again
//   文の中で    ことのあめ's sentences holding the words, with their clips
// then the new letter and the letters typed off the way are said to come back (ことのあめ's violet). Nothing is scored.

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import page from "@/components/page.module.css";
import { Icon } from "@/components/Icon";
import { useOpenLetter } from "@/components/LetterSheet";
import { preload, stop } from "@/components/sound";
import { TypeLine } from "@/components/TypeLine";
import SENTENCES from "@/content/sentences.json";
import { isWay, lettersOf, PATCHIM, SAID } from "@/lib/hangul";
import { ja } from "@/lib/i18n/ja";
import { LESSON_IDS, LESSONS } from "@/lib/lessons";
import { planRain, type RainPlan } from "@/lib/rain-core";
import { clearLetters, dayOf, finishRain, knownSet, meetLetters, mixLetters, readWord, typedWord } from "@/lib/record";
import type { Sentence } from "@/lib/sentences";
import { commit, getState, useRecord } from "@/lib/store";
import parts from "../_parts/parts.module.css";
import { WordCard } from "../_parts/WordCard";
import { Lines } from "./Lines";
import { Notice } from "./Notice";
import { Track, type RainStep } from "./Track";
import styles from "./rain.module.css";

type Phase = RainStep | "end";

const nameOf = (item: string) => (item === PATCHIM ? ja.letter.patchim.title : item === SAID ? ja.letter.said.title : item);

export function Rain() {
  const state = useRecord();
  const [plan, setPlan] = useState<RainPlan | null>(null);
  const [phase, setPhase] = useState<Phase>("read");
  const [typing, setTyping] = useState(0);
  const [mixed, setMixed] = useState<string[]>([]);
  const [firstToday, setFirstToday] = useState(false);
  const openLetter = useOpenLetter();

  const start = useCallback(() => {
    stop();
    const s = getState();
    const p = planRain(s, Date.now(), SENTENCES as Sentence[]);
    setPlan(p);
    setPhase("read");
    setTyping(0);
    setMixed([]);
    setFirstToday(!s.rains.some((r) => dayOf(r.at) === dayOf(Date.now())));
    preload(p.words.map((w) => w.ko));
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    // The first rain is chosen once the page is on the device, where the record is.
    if (state && !plan) {
      const t = window.setTimeout(start, 0);
      return () => window.clearTimeout(t);
    }
  }, [state, plan, start]);

  useEffect(() => () => stop(), []);

  // What the learner has met so far: a letter opened in its sheet is met there and then.
  const known = useMemo(() => (state ? knownSet(state) : new Set<string>()), [state]);
  const dueSet = useMemo(() => new Set(plan?.due ?? []), [plan]);

  if (!state || !plan) {
    return (
      <div className={page.page}>
        <header className={page.bar}>
          <h1 className={page.barTitle}>{ja.rain.title}</h1>
        </header>
        <p className={page.skeleton}>{state ? ja.rain.loading : ja.common.loading}</p>
      </div>
    );
  }

  const steps = [
    { step: "read" as const, label: ja.rain.steps.read },
    ...(plan.fresh ? [{ step: "notice" as const, label: ja.rain.steps.notice }] : []),
    { step: "type" as const, label: ja.rain.steps.type },
    ...(plan.lines.length ? [{ step: "lines" as const, label: ja.rain.steps.lines }] : []),
  ];
  const after = (step: RainStep): Phase => steps[steps.findIndex((s) => s.step === step) + 1]?.step ?? "end";
  /** `more`: letters typed off the way just now, not yet in `mixed`. */
  const go = (to: Phase, more: string[] = []) => {
    stop();
    if (to === "end") {
      const met = plan.fresh ? [plan.fresh] : [];
      const all = [...new Set([...mixed, ...more])];
      const entry = { at: plan.at, words: plan.words.map((w) => w.ko), met, mixed: all, typed: plan.types.map((w) => w.ko) };
      commit((s) => finishRain(meetLetters(s, met, Date.now()), entry));
    }
    setPhase(to);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className={page.page}>
      <header className={page.bar}>
        <h1 className={page.barTitle}>{ja.rain.title}</h1>
      </header>
      <div className={styles.body}>
        <Track steps={steps} current={phase === "end" ? steps[steps.length - 1].step : phase} done={phase === "end"} />

        {phase === "read" ? (
          <>
            <p className={parts.lead}>{state.rains.length ? ja.rain.readLead : ja.rain.firstLead}</p>
            {plan.due.length ? <p className={styles.due}>{ja.rain.dueLead}</p> : null}
            <ul className={parts.words}>
              {plan.words.map((w, i) => (
                <WordCard
                  key={`${plan.at}:${w.ko}`}
                  word={w}
                  known={known}
                  index={i}
                  again={lettersOf(w.ko).some((l) => dueSet.has(l.ch))}
                  onReveal={() => commit((s) => readWord(s, w.ko, Date.now()))}
                />
              ))}
            </ul>
            <div className={parts.actions}>
              <button type="button" className="btn" onClick={() => go(after("read"))}>
                {ja.common.next}
                <Icon name="arrow" size={18} />
              </button>
            </div>
          </>
        ) : null}

        {phase === "notice" && plan.fresh ? <Notice key={plan.at} fresh={plan.fresh} words={plan.words} known={known} onDone={() => go(after("notice"))} /> : null}

        {phase === "type" ? (
          <>
            <div className={styles.typeHead}>
              <p className={parts.lead}>{ja.rain.typeLead}</p>
              <span className={parts.progress}>{ja.common.countOf(typing + 1, plan.types.length)}</span>
            </div>
            <TypeLine
              key={`${plan.at}:${typing}`}
              target={plan.types[typing].ko}
              meaning={plan.types[typing].ja}
              hearFirst
              onTyped={(r) => {
                const w = plan.types[typing];
                commit((s) => {
                  const now = Date.now();
                  let next = typedWord(s, w.ko, now);
                  next = r.mixed.length ? mixLetters(next, r.mixed, now) : next;
                  // Typed without going off the way: its letters that were owed are owed no longer.
                  if (!r.mixed.length) next = clearLetters(next, lettersOf(w.ko).map((l) => l.ch), now);
                  return next;
                });
                if (r.mixed.length) setMixed((m) => [...new Set([...m, ...r.mixed])]);
              }}
              onDone={(r) => {
                if (typing + 1 < plan.types.length) setTyping(typing + 1);
                else go(after("type"), r.mixed);
              }}
            />
          </>
        ) : null}

        {phase === "lines" ? <Lines lines={plan.lines} known={new Set([...known, ...(plan.fresh ? [plan.fresh] : [])])} onDone={() => go("end")} /> : null}

        {phase === "end" ? (
          <section className={styles.end}>
            <p className={styles.endLabel}>{ja.rain.endTitle}</p>
            {plan.fresh ? (
              <div className={styles.met}>
                <p className={styles.metLead}>{ja.rain.metLead}</p>
                <button type="button" className={`${isWay(plan.fresh) ? "" : "t-ko"} ${styles.metItem}`} onClick={() => openLetter(plan.fresh as string)}>
                  {nameOf(plan.fresh)}
                </button>
              </div>
            ) : null}
            {mixed.length ? (
              <div className={styles.owed}>
                <p className={styles.metLead}>{ja.rain.mixedLead}</p>
                <p className={styles.owedLetters}>
                  {mixed.map((ch) => (
                    <button key={ch} type="button" className={`t-ko ${styles.owedLetter}`} onClick={() => openLetter(ch)}>
                      {ch}
                    </button>
                  ))}
                </p>
              </div>
            ) : null}
            {plan.fresh || mixed.length ? <p className={parts.lead}>{ja.rain.comesBack(!!plan.fresh, mixed.length > 0)}</p> : null}
            {firstToday ? <p className={parts.lead}>{ja.rain.enough}</p> : null}
            {(() => {
              // The next of the next 90 seconds, while one is left that still has something new.
              const lesson = LESSONS.find((l) => !state.lessons?.[l.id] && l.items.some((x) => !known.has(x)));
              if (!lesson) return null;
              const c = ja.next.lessons[lesson.id];
              return (
                <Link href={`/app/next/${lesson.id}`} className={styles.nextLesson}>
                  <span className={styles.nextKicker}>{ja.next.number(LESSON_IDS.indexOf(lesson.id))}</span>
                  <span className={styles.nextName}>{c.name}</span>
                  <span className={styles.nextLead}>{c.lead}</span>
                </Link>
              );
            })()}
            <div className={parts.actions}>
              <button type="button" className="btn" onClick={start}>
                {ja.rain.nextRain}
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
