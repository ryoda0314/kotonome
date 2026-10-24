"use client";

// 最初の90秒 (CONCEPT.md: 入口): what the film this app grew from shows first, as lightly, a little at a time and
// practised many times right after each part (原則2). The five consonants are pictures of the mouth, three seen from the
// side, then two from the front; then, in the same places, a stroke more makes ㄷ and ㅂ, then ㅈ and ㅎ (the mouth of
// the plain one, the two side by side, the two sounds one after the other); then ㄹ, by its shape. After each part,
// 思い出す: hear it, press its letter, many goes; a wrong press shows the mouth again. The basic vowels are heard, not
// built, and practised the same way. A consonant and a vowel make one square, and three words are read with only these.
// No table to learn, no rules, nothing counted; the rest of the letters are met in the rain. Once, and it may be passed
// over.

import { useEffect, useState, type ReactNode } from "react";
import { InkSvg, Letter, useMorph, type Ink } from "@/components/Glyph";
import { Grown } from "@/components/Grown";
import { Icon } from "@/components/Icon";
import { MouthPicture, type MouthLetter } from "@/components/Mouth";
import page from "@/components/page.module.css";
import { Speak } from "@/components/Speak";
import { say, stop, usePlaying } from "@/components/sound";
import { WORD } from "@/content/words";
import { CONSONANTS, letterStrokes, mapBox, syllableParts } from "@/lib/glyph";
import { FIRST_LETTERS, LETTER, soundOf } from "@/lib/hangul";
import { ja } from "@/lib/i18n/ja";
import { letterPractice } from "@/lib/practice";
import { Practice } from "../_parts/Practice";
import { WordCard } from "../_parts/WordCard";
import parts from "../_parts/parts.module.css";
import styles from "./first.module.css";

const t = ja.first;
const FIRST = new Set(FIRST_LETTERS);

/** One consonant out of the mouth: the mouth says its row of kana, the letter is written over it, then lifts off. */
function MouthPage({ ch }: { ch: MouthLetter }) {
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  useEffect(() => {
    const a = window.setTimeout(() => setStage(1), 1400);
    const b = window.setTimeout(() => {
      setStage(2);
      void say(soundOf(ch), { key: `first:${ch}` });
    }, 2600);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [ch]);
  return (
    <>
      <p className={styles.big}>{t.mouth[ch].say}</p>
      <div className={styles.picture}>
        <MouthPicture ch={ch} stage={stage} label={t.mouth[ch].how} />
      </div>
      <p className={styles.text}>{t.mouth[ch].how}</p>
      <div className={styles.speakLine} data-shown={stage === 2 ? "" : undefined}>
        <Speak text={soundOf(ch)} label={`${soundOf(ch)} ${ja.common.hear}`} id={`first:${ch}`} />
        <span className="t-ko">{soundOf(ch)}</span>
      </div>
    </>
  );
}

/**
 * 思い出す: right after seeing them, the letters are practised many times (CONCEPT.md, 原則2): a letter's sound is
 * said, its letter pressed, every letter three rounds over; a miss shows the mouth (for a vowel, how it is said) and
 * comes again a little later (`_parts/Practice.tsx`).
 */
function Recall({ letters, lead, done }: { letters: string[]; lead: string; done: string }) {
  return (
    <>
      <p className={styles.big}>{t.recall.title}</p>
      <p className={styles.text}>{lead}</p>
      <Practice
        items={letterPractice(letters, 3)}
        face={(ch, lit) => <Letter ch={ch} size={48} color={lit ? "var(--accent)" : undefined} />}
        hint={(ch) => {
          const l = LETTER.get(ch);
          if (!l) return null;
          if (l.kind === "vowel") return <p className={styles.hintText}>{t.recall.vowelHint(l.how ?? l.anchor)}</p>;
          if (ch === "ㄹ") return <p className={styles.hintText}>{t.recall.rieulHint}</p>;
          // A letter grown from one of the five: the mouth of that one, and how it grew.
          const mouthOf = (l.from?.[0] ?? ch) as MouthLetter;
          return (
            <div className={styles.hintMouth}>
              <span className={styles.hintPicture}>
                <MouthPicture ch={mouthOf} stage={0} label={t.mouth[mouthOf].how} />
              </span>
              <span className={styles.hintText}>{l.from ? t.grow.items[ch].how : t.recall.mouthHint(t.mouth[ch].row)}</span>
            </div>
          );
        }}
        done={
          <>
            <div className={styles.recalledRow}>
              {letters.map((ch) => (
                <Letter key={ch} ch={ch} size={44} />
              ))}
            </div>
            <p className={styles.big}>{done}</p>
          </>
        }
      />
    </>
  );
}

/**
 * A letter grown from one of the five, in the same place: the mouth of the plain one, the two side by side (the stroke
 * that grew written in, lit), and the two sounds one after the other (나, then 다).
 */
function GrowPage({ ch }: { ch: string }) {
  const base = (LETTER.get(ch)?.from?.[0] ?? "ㄴ") as MouthLetter;
  const item = t.grow.items[ch];
  useEffect(() => {
    const a = window.setTimeout(() => void say(soundOf(base), { key: `grow:${base}` }), 900);
    const b = window.setTimeout(() => void say(soundOf(ch), { key: `grow:${ch}` }), 2200);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [ch, base]);
  return (
    <>
      <p className={styles.kicker}>{t.grow.title}</p>
      <p className={styles.big}>{item.say}</p>
      <div className={styles.growRow}>
        <span className={styles.growPicture}>
          <MouthPicture ch={base} stage={0} label={t.mouth[base].how} />
        </span>
        <Grown ch={ch} size={60} />
      </div>
      <p className={styles.text}>{item.how}</p>
      <div className={styles.pairSounds}>
        <Speak text={soundOf(base)} label={`${soundOf(base)} ${ja.common.hear}`} id={`grow:${base}`} />
        <span className="t-ko">{soundOf(base)}</span>
        <Icon name="arrow" size={18} />
        <Speak text={soundOf(ch)} label={`${soundOf(ch)} ${ja.common.hear}`} id={`grow:${ch}`} />
        <span className="t-ko">{soundOf(ch)}</span>
      </div>
    </>
  );
}

/** ㄹ, the one left: by its shape, like ら. */
function RieulPage() {
  useEffect(() => {
    const a = window.setTimeout(() => void say("라", { key: "grow:ㄹ" }), 1200);
    return () => window.clearTimeout(a);
  }, []);
  return (
    <>
      <p className={styles.kicker}>{t.grow.rieulTitle}</p>
      <div className={styles.rieulRow}>
        <Letter ch="ㄹ" size={96} draw />
        <span className={styles.ra}>ら</span>
      </div>
      <p className={styles.text}>{t.grow.rieul}</p>
      <div className={styles.pairSounds}>
        <Speak text="라" label={`라 ${ja.common.hear}`} id="grow:ㄹ" />
        <span className="t-ko">라</span>
      </div>
    </>
  );
}

function VowelsPage() {
  const playing = usePlaying();
  return (
    <>
      <p className={styles.big}>{t.vowels.title}</p>
      <p className={styles.text}>{t.vowels.lead}</p>
      <ul className={styles.vowels}>
        {t.vowels.items.map((v, i) => (
          <li key={v.ch} style={{ animationDelay: `${i * 0.12}s` }}>
            <button
              type="button"
              className={styles.vowel}
              data-playing={playing === `first:${v.ch}` ? "" : undefined}
              onClick={() => void say(soundOf(v.ch), { key: `first:${v.ch}` })}
              aria-label={`${v.ch} ${v.say}`}
            >
              <Letter ch={v.ch} size={48} />
              <span className={styles.vowelSay}>{v.say}</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

const SIZE = 100;
const GAP = 40;

/** A consonant and a vowel apart, then in one square, and apart again: the parts slide, point for point. */
function Join({ syl }: { syl: string }) {
  const [together, setTogether] = useState(false);
  useEffect(() => {
    const id = window.setInterval(() => setTogether((x) => !x), 1800);
    return () => window.clearInterval(id);
  }, []);
  const p = syllableParts(syl);
  const width = SIZE * 2 + GAP;
  const items: Ink[] = p.flatMap((part) => {
    const apart =
      part.role === "cho"
        ? mapBox(CONSONANTS[part.ch].strokes, [0, 0, SIZE, SIZE])
        : mapBox(letterStrokes(part.ch), [SIZE + GAP, 0, width, SIZE]);
    const joined = mapBox(part.strokes, [(width - SIZE) / 2, 0, (width + SIZE) / 2, SIZE]);
    return (together ? joined : apart).map((pts, i) => ({
      key: `${part.role}:${i}`,
      pts,
      color: part.role === "jung" ? "var(--accent)" : "var(--ink)",
      width: 7.6,
    }));
  });
  const drawn = useMorph(items);
  return (
    <span className={styles.join}>
      <InkSvg items={drawn} width={width} height={SIZE} draw={false} label={syl} />
    </span>
  );
}

function JoinPage() {
  return (
    <>
      <p className={styles.big}>{t.join.title}</p>
      <p className={styles.text}>{t.join.lead}</p>
      <div className={styles.joins}>
        <Join syl="나" />
        <Join syl="무" />
      </div>
      <p className={styles.text}>{t.join.read}</p>
      <ul className={parts.words}>
        {t.join.words.map((ko, i) => {
          const w = WORD.get(ko);
          return w ? <WordCard key={ko} word={w} known={FIRST} index={i} /> : null;
        })}
      </ul>
    </>
  );
}

function EndPage() {
  return (
    <>
      <p className={styles.big}>{t.end.title}</p>
      {t.end.body.map((x) => (
        <p key={x} className={styles.text}>
          {x}
        </p>
      ))}
      <div className={styles.letters}>
        {FIRST_LETTERS.map((ch) => (
          <Letter key={ch} ch={ch} size={34} />
        ))}
      </div>
    </>
  );
}

const mouth = (ch: MouthLetter) => ({ key: ch, render: () => <MouthPage ch={ch} /> });
const VOWELS = [..."ㅏㅓㅗㅜㅡㅣ"];

const PAGES: { key: string; render: () => ReactNode }[] = [
  // Seen from the side: the tongue and the throat.
  mouth("ㄱ"),
  mouth("ㄴ"),
  mouth("ㅇ"),
  { key: "recall-3", render: () => <Recall letters={["ㄱ", "ㄴ", "ㅇ"]} lead={t.recall.consonants} done={t.recall.done(3)} /> },
  // Seen from the front: the lips and the teeth.
  mouth("ㅁ"),
  mouth("ㅅ"),
  { key: "recall-5", render: () => <Recall letters={["ㄱ", "ㄴ", "ㅇ", "ㅁ", "ㅅ"]} lead={t.recall.consonants} done={t.recall.done(5)} /> },
  // In the same places, a stroke more: two at a time, each two practised at once.
  { key: "grow-ㄷ", render: () => <GrowPage ch="ㄷ" /> },
  { key: "grow-ㅂ", render: () => <GrowPage ch="ㅂ" /> },
  { key: "recall-db", render: () => <Recall letters={["ㄴ", "ㄷ", "ㅁ", "ㅂ"]} lead={t.recall.consonants} done={t.recall.donePair("ㄷ", "ㅂ")} /> },
  { key: "grow-ㅈ", render: () => <GrowPage ch="ㅈ" /> },
  { key: "grow-ㅎ", render: () => <GrowPage ch="ㅎ" /> },
  { key: "recall-jh", render: () => <Recall letters={["ㅅ", "ㅈ", "ㅇ", "ㅎ"]} lead={t.recall.consonants} done={t.recall.donePair("ㅈ", "ㅎ")} /> },
  { key: "rieul", render: () => <RieulPage /> },
  { key: "recall-r", render: () => <Recall letters={["ㄴ", "ㄷ", "ㄹ"]} lead={t.recall.consonants} done={t.recall.doneRieul} /> },
  { key: "vowels", render: () => <VowelsPage /> },
  { key: "recall-vowels", render: () => <Recall letters={VOWELS} lead={t.recall.vowels} done={t.recall.doneVowels} /> },
  { key: "join", render: () => <JoinPage /> },
  { key: "end", render: () => <EndPage /> },
];

export function First({ onFinish }: { onFinish: () => void }) {
  const [at, setAt] = useState(0);
  const last = at === PAGES.length - 1;
  const go = (to: number) => {
    stop();
    setAt(to);
    window.scrollTo({ top: 0 });
  };
  useEffect(() => () => stop(), []);
  return (
    <div className={page.page}>
      <header className={page.bar}>
        <h1 className={page.barTitle}>{t.title}</h1>
        <span className={styles.pageOf}>{t.pageOf(at + 1, PAGES.length)}</span>
        {last ? null : (
          <button type="button" className={page.barButton} onClick={onFinish}>
            {t.skip}
          </button>
        )}
      </header>
      <ol className={styles.dots} aria-hidden="true">
        {PAGES.map((p, i) => (
          <li key={p.key} data-state={i < at ? "done" : i === at ? "now" : "next"} />
        ))}
      </ol>
      <section className={styles.body} key={PAGES[at].key}>
        {PAGES[at].render()}
      </section>
      <footer className={styles.foot}>
        {at > 0 ? (
          <button type="button" className="btn-quiet" onClick={() => go(at - 1)} aria-label={ja.common.back}>
            <Icon name="back" size={18} />
          </button>
        ) : null}
        <button type="button" className="btn" onClick={() => (last ? onFinish() : go(at + 1))}>
          {last ? t.end.start : ja.common.next}
          <Icon name="arrow" size={18} />
        </button>
      </footer>
    </div>
  );
}
