"use client";

// The kinds of page the 90 seconds and the next 90 seconds are made of: a letter out of the mouth, letters grown from
// known ones (beside them, their sounds one after the other), 思い出す (many goes, `_parts/Practice.tsx`), letters
// coming together in one square, words to read, to hear side by side, and the end. Nothing is counted.

import { Fragment, useEffect, useState, type ReactNode } from "react";
import { InkSvg, Letter, useMorph, Word, type Ink } from "@/components/Glyph";
import { Grown } from "@/components/Grown";
import { Icon } from "@/components/Icon";
import { MouthPicture, type MouthLetter } from "@/components/Mouth";
import { Speak } from "@/components/Speak";
import { say, usePlaying } from "@/components/sound";
import { WORD } from "@/content/words";
import { CONSONANTS, letterStrokes, mapBox, syllableParts } from "@/lib/glyph";
import { LETTER, soundOf } from "@/lib/hangul";
import { ja } from "@/lib/i18n/ja";
import type { PracticeItem } from "@/lib/practice";
import { Compare } from "../_parts/Compare";
import { Practice } from "../_parts/Practice";
import { WordCard } from "../_parts/WordCard";
import parts from "../_parts/parts.module.css";
import styles from "./lessons.module.css";

const t = ja.first;
const MOUTHS = new Set(["ㄱ", "ㄴ", "ㅇ", "ㅁ", "ㅅ"]);

/** The mouth a consonant is made in: one of the five, following what it grew from (ㅌ → ㄷ → ㄴ). */
export function mouthOf(ch: string): MouthLetter | undefined {
  let x: string | undefined = ch;
  while (x && !MOUTHS.has(x)) x = LETTER.get(x)?.kind === "cons" ? LETTER.get(x)?.from?.[0] : undefined;
  return x as MouthLetter | undefined;
}

/** What a letter's sounds are, from what it comes from to it: 나 → 다, 오 아 → 와. */
const chainOf = (ch: string) => [...(LETTER.get(ch)?.from ?? []).map(soundOf), soundOf(ch)];

/** One consonant out of the mouth: the mouth says its row of kana, the letter is written over it, then lifts off. */
export function MouthPage({ ch }: { ch: MouthLetter }) {
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
 * Letters grown from known ones: for a consonant the mouth it is made in; each letter beside what it comes from (the
 * strokes that grew written in, lit) and its sounds one after the other (나 → 다; 오 아 → 와), the first said at once.
 */
export function GrowPage({ chs, kicker, say: line, how }: { chs: string[]; kicker: string; say: string; how: string }) {
  const mouth = mouthOf(chs[0]);
  const first = chainOf(chs[0]);
  useEffect(() => {
    const timers = first.map((s, i) => window.setTimeout(() => void say(s, { key: `grow:${s}` }), 900 + i * 1300));
    return () => timers.forEach((x) => window.clearTimeout(x));
    // Said once as the page comes up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chs.join("")]);
  return (
    <>
      <p className={styles.kicker}>{kicker}</p>
      <p className={styles.big}>{line}</p>
      <div className={styles.growRow}>
        {mouth ? (
          <span className={styles.growPicture}>
            <MouthPicture ch={mouth} stage={0} label={t.mouth[mouth].how} />
          </span>
        ) : null}
        <div className={styles.grownList}>
          {chs.map((ch) => (
            <Grown key={ch} ch={ch} size={chs.length > 1 ? 48 : 60} />
          ))}
        </div>
      </div>
      <p className={styles.text}>{how}</p>
      {chs.map((ch) => (
        <div key={ch} className={styles.pairSounds}>
          {chainOf(ch).map((s, i, all) => (
            <Fragment key={`${s}:${i}`}>
              <Speak text={s} label={`${s} ${ja.common.hear}`} id={`grow:${s}`} size="sm" />
              <span className="t-ko">{s}</span>
              {i === all.length - 2 ? <Icon name="arrow" size={16} /> : i < all.length - 1 ? <span className={styles.plus}>＋</span> : null}
            </Fragment>
          ))}
        </div>
      ))}
    </>
  );
}

/** ㄹ, the one left: by its shape, like ら. */
export function RieulPage() {
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

/** What helps find a letter again after a miss: the mouth it is made in, or for a vowel how it is said. */
function letterHint(ch: string): ReactNode {
  const l = LETTER.get(ch);
  if (!l) return null;
  if (ch === "ㄹ") return <p className={styles.hintText}>{t.recall.rieulHint}</p>;
  const text =
    t.grow.items[ch]?.how ?? (MOUTHS.has(ch) ? t.recall.mouthHint(t.mouth[ch].row) : l.how ? `${l.anchor}。${l.how}。` : `${l.anchor}。`);
  const mouth = mouthOf(ch);
  return (
    <div className={styles.hintMouth}>
      {mouth ? (
        <span className={styles.hintPicture}>
          <MouthPicture ch={mouth} stage={0} label={t.mouth[mouth].how} />
        </span>
      ) : l.from ? (
        <Grown ch={ch} size={40} />
      ) : null}
      <span className={styles.hintText}>{text}</span>
    </div>
  );
}

/**
 * 思い出す: right after something is seen, it is practised many times (CONCEPT.md, 原則2): a sound is said and its
 * letter (or word) pressed, round after round; a miss shows the mouth (for a vowel how it is said, for a word what to
 * listen for) and comes again a little later.
 */
export function Recall({
  items,
  lead,
  done,
  wordHint,
}: {
  items: PracticeItem[];
  lead: string;
  done: ReactNode;
  /** For words: what to listen for after a miss. */
  wordHint?: string;
}) {
  const shown = [...new Set(items.flatMap((x) => x.choices))];
  return (
    <>
      <p className={styles.big}>{t.recall.title}</p>
      <p className={styles.text}>{lead}</p>
      <Practice
        items={items}
        face={(id, lit) =>
          LETTER.has(id) ? (
            <Letter ch={id} size={48} color={lit ? "var(--accent)" : undefined} />
          ) : (
            <>
              <Word text={id} height={40} fit />
              <span className={parts.seenMeaning}>{WORD.get(id)?.ja}</span>
            </>
          )
        }
        hint={(id) => (LETTER.has(id) ? letterHint(id) : <p className={styles.hintText}>{wordHint}</p>)}
        done={
          <>
            <div className={styles.recalledRow}>
              {shown.map((id) => (LETTER.has(id) ? <Letter key={id} ch={id} size={40} /> : <Word key={id} text={id} height={32} />))}
            </div>
            <p className={styles.big}>{done}</p>
          </>
        }
      />
    </>
  );
}

/** The six basic vowels, to hear. */
export function VowelsPage() {
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

/** A syllable's letters apart in a row, then in one square, and apart again: the parts slide, point for point. */
function Join({ syl }: { syl: string }) {
  const [together, setTogether] = useState(false);
  useEffect(() => {
    const id = window.setInterval(() => setTogether((x) => !x), 1800);
    return () => window.clearInterval(id);
  }, []);
  const p = syllableParts(syl);
  const width = p.length * SIZE + (p.length - 1) * GAP;
  const items: Ink[] = p.flatMap((part, k) => {
    const box: [number, number, number, number] = [k * (SIZE + GAP), 0, k * (SIZE + GAP) + SIZE, SIZE];
    const apart = mapBox(part.role === "jung" ? letterStrokes(part.ch) : CONSONANTS[part.ch].strokes, box);
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

export function JoinPage({ syls, title, lead }: { syls: string[]; title: string; lead: string }) {
  return (
    <>
      <p className={styles.big}>{title}</p>
      <p className={styles.text}>{lead}</p>
      <div className={styles.joins} style={{ gridTemplateColumns: `repeat(${syls.length}, minmax(0, 1fr))` }}>
        {syls.map((s) => (
          <Join key={s} syl={s} />
        ))}
      </div>
    </>
  );
}

/** Words to read with only what is known; pressed, each says itself and shows its meaning and letters. */
export function ReadPage({ words, title, lead, known }: { words: string[]; title?: string; lead: string; known: ReadonlySet<string> }) {
  return (
    <>
      {title ? <p className={styles.big}>{title}</p> : null}
      <p className={styles.text}>{lead}</p>
      <ul className={parts.words}>
        {words.map((ko, i) => {
          const w = WORD.get(ko);
          return w ? <WordCard key={ko} word={w} known={known} index={i} /> : null;
        })}
      </ul>
    </>
  );
}

/** Something to see and hear: mouths in a row, then words with their sounds (and how they are said, if otherwise). */
export function ShowPage({ title, body, mouths = [], words }: { title: string; body: string; mouths?: string[]; words: string[] }) {
  return (
    <>
      <p className={styles.big}>{title}</p>
      {mouths.length ? (
        <div className={styles.mouths}>
          {mouths.map((m) => (
            <span key={m} className={styles.mouthSmall}>
              <MouthPicture ch={m as MouthLetter} stage={0} label={t.mouth[m].how} />
            </span>
          ))}
        </div>
      ) : null}
      <p className={styles.text}>{body}</p>
      <ul className={styles.showWords}>
        {words.map((ko) => (
          <li key={ko}>
            <Speak text={ko} label={`${ko} ${ja.common.hear}`} id={`show:${ko}`} />
            <Word text={ko} height={44} />
            <span className={styles.showMeaning}>
              {WORD.get(ko)?.ja}
              {WORD.get(ko)?.say ? <span className="t-ko">［{WORD.get(ko)?.say}］</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

export function ComparePage({ title, lead, groups }: { title: string; lead: string; groups: string[][] }) {
  return (
    <>
      <p className={styles.big}>{title}</p>
      <p className={styles.text}>{lead}</p>
      <Compare groups={groups} title="" />
    </>
  );
}

export function EndPage({ title, body, letters }: { title: string; body: string[]; letters: string[] }) {
  return (
    <>
      <p className={styles.big}>{title}</p>
      {body.map((x) => (
        <p key={x} className={styles.text}>
          {x}
        </p>
      ))}
      <div className={styles.letters}>
        {letters.map((ch) => (LETTER.has(ch) ? <Letter key={ch} ch={ch} size={34} /> : null))}
      </div>
    </>
  );
}
