"use client";

// The kinds of page 最初の16字 and 次の字 are made of: a letter out of the mouth, letters grown from
// known ones (beside them, their sounds one after the other), vowels two at a time with their mouths, 思い出す (many
// goes, `_parts/Practice.tsx`), letters coming together in one square, a word read one square at a time, words to read,
// to hear side by side, and the end. Nothing is counted. What moves goes slowly enough to follow, a part at a time, and
// once through can be watched again (a learner on their own, with no one beside them to say it again).

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { FAINT, GAP, InkSvg, Letter, syllableInk, useMorph, Word, type Ink } from "@/components/Glyph";
import { Grown } from "@/components/Grown";
import { Icon } from "@/components/Icon";
import { MouthPicture, slowTimes, VOWEL_MOUTHS, VowelMouth, type MouthLetter } from "@/components/Mouth";
import { Speak } from "@/components/Speak";
import { say, stop, usePlaying } from "@/components/sound";
import { WORD } from "@/content/words";
import { CONSONANTS, letterStrokes, mapBox, syllableParts, syllablesOf } from "@/lib/glyph";
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
/** In 最初の16字 a consonant is heard with ㅏ (가) before any vowel is met: ㅏ is drawn faint. */
export const VOWEL_LATER: ReadonlySet<string> = new Set(["ㅏ"]);

/** The mouth a consonant is made in: one of the five, following what it grew from (ㅌ → ㄷ → ㄴ). */
export function mouthOf(ch: string): MouthLetter | undefined {
  let x: string | undefined = ch;
  while (x && !MOUTHS.has(x)) x = LETTER.get(x)?.kind === "cons" ? LETTER.get(x)?.from?.[0] : undefined;
  return x as MouthLetter | undefined;
}

/** What a letter's sounds are, from what it comes from to it: 나 → 다, 오 아 → 와. */
const chainOf = (ch: string) => [...(LETTER.get(ch)?.from ?? []).map(soundOf), soundOf(ch)];

/** もう一度見る, once a page's motion is through; its room kept, so nothing jumps. */
function Replay({ shown, onReplay }: { shown: boolean; onReplay: () => void }) {
  return (
    <div className={styles.replayRow}>
      {shown ? (
        <button
          type="button"
          className="btn-quiet"
          onClick={() => {
            stop();
            onReplay();
          }}
        >
          <Icon name="replay" size={18} />
          {t.replay}
        </button>
      ) : null}
    </div>
  );
}

/** Time to say the row of kana oneself once the tongue is in place, and to see the letter on the drawing (ms). */
const SAY_HOLD = 1800;
const LOOK = 1500;

/**
 * One consonant out of the mouth, slowly and one part at a time, each sentence shown as the picture gets there: the
 * mouth at rest, then saying its row of kana (what it does), the letter written over the part that makes it (that is
 * the letter), then lifted off and said, heard with ㅏ (가) drawn faint and said to be the left one. Once through, it
 * can be watched again.
 */
export function MouthPage({ ch }: { ch: MouthLetter }) {
  const m = t.mouth[ch];
  const [run, setRun] = useState(0);
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const [shown, setShown] = useState(0);
  const [through, setThrough] = useState(false);
  useEffect(() => {
    const at = slowTimes(ch);
    const start = at.placed ? at.still : 700;
    const write = at.placed ? at.placed + SAY_HOLD : start + 2000;
    const lift = write + at.written + LOOK;
    const timers = [
      window.setTimeout(() => setShown(1), start),
      window.setTimeout(() => {
        setStage(1);
        setShown(2);
      }, write),
      window.setTimeout(() => {
        setStage(2);
        setShown(3);
        void say(soundOf(ch), { key: `first:${ch}` });
      }, lift),
      window.setTimeout(() => setThrough(true), lift + at.lift + 300),
    ];
    return () => timers.forEach((x) => window.clearTimeout(x));
  }, [ch, run]);
  const syl = soundOf(ch);
  return (
    <>
      <p className={styles.big}>{m.say}</p>
      <div className={styles.picture}>
        <MouthPicture key={run} ch={ch} stage={stage} label={m.how} slow />
      </div>
      <div className={styles.steps}>
        {m.steps.map((s, i) => (
          <p key={s} className={styles.step} data-shown={i < shown ? "" : undefined}>
            {s}
          </p>
        ))}
      </div>
      <div className={styles.speakLine} data-shown={stage === 2 ? "" : undefined}>
        <Speak text={syl} label={`${syl} ${ja.common.hear}`} id={`first:${ch}`} />
        <Word text={syl} height={40} faint={VOWEL_LATER} />
        <span className={styles.leftOnly}>{t.leftOnly(ch)}</span>
      </div>
      <Replay
        shown={through}
        onReplay={() => {
          setStage(0);
          setShown(0);
          setThrough(false);
          setRun((r) => r + 1);
        }}
      />
    </>
  );
}

/** The sounds of a grown letter one after another (나 → 다), drawn, `faint` letters faint. */
function Chain({ ch, faint }: { ch: string; faint?: ReadonlySet<string> }) {
  return (
    <div className={styles.pairSounds}>
      {chainOf(ch).map((s, i, all) => (
        <Fragment key={`${s}:${i}`}>
          <Speak text={s} label={`${s} ${ja.common.hear}`} id={`grow:${s}`} size="sm" />
          <Word text={s} height={30} faint={faint} />
          {i === all.length - 2 ? <Icon name="arrow" size={16} /> : i < all.length - 1 ? <span className={styles.plus}>＋</span> : null}
        </Fragment>
      ))}
    </div>
  );
}

/** Each sound of a grown letter's chain, and the pause before it is said through again (ms). */
const CHAIN_STEP = 1400;
const CHAIN_PAUSE = 1200;

/**
 * Letters grown from known ones: for a consonant the mouth it is made in; each letter beside what it comes from (the
 * strokes that grew written in, lit) and its sounds one after the other, said through twice (나 → 다, 나 → 다). Once
 * through, it can be watched again. `faint`: letters not met yet, drawn faint in the sounds, `note` saying which one to
 * look at (最初の16字).
 */
export function GrowPage({
  chs,
  kicker,
  say: line,
  how,
  faint,
  note,
}: {
  chs: string[];
  kicker: string;
  say: string;
  how: string;
  faint?: ReadonlySet<string>;
  note?: string;
}) {
  const mouth = mouthOf(chs[0]);
  const [run, setRun] = useState(0);
  const [through, setThrough] = useState(false);
  const first = chainOf(chs[0]);
  useEffect(() => {
    const round = first.length * CHAIN_STEP + CHAIN_PAUSE;
    const times = [0, 1].flatMap((r) => first.map((s, i) => ({ s, at: 900 + r * round + i * CHAIN_STEP })));
    const timers = times.map(({ s, at }) => window.setTimeout(() => void say(s, { key: `grow:${s}` }), at));
    timers.push(window.setTimeout(() => setThrough(true), times[times.length - 1].at + CHAIN_STEP));
    return () => timers.forEach((x) => window.clearTimeout(x));
    // Said as the page comes up, and again on もう一度見る.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chs.join(""), run]);
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
        <div className={styles.grownList} key={run}>
          {chs.map((ch) => (
            <Grown key={ch} ch={ch} size={chs.length > 1 ? 48 : 60} />
          ))}
        </div>
      </div>
      <p className={styles.text}>{how}</p>
      {chs.map((ch) => (
        <Chain key={ch} ch={ch} faint={faint} />
      ))}
      {note ? <p className={styles.leftOnly}>{note}</p> : null}
      <Replay
        shown={through}
        onReplay={() => {
          setThrough(false);
          setRun((r) => r + 1);
        }}
      />
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
      <div className={styles.speakLine} data-shown="">
        <Speak text="라" label={`라 ${ja.common.hear}`} id="grow:ㄹ" />
        <Word text="라" height={40} faint={VOWEL_LATER} />
        <span className={styles.leftOnly}>{t.leftOnly("ㄹ")}</span>
      </div>
    </>
  );
}

/**
 * What helps find a letter again after a miss: the mouth it is made in (one of the five written over it, so the mouth
 * leads back to the letter), what it grew from, or for a vowel its mouth and how it is said.
 */
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
          <MouthPicture ch={mouth} stage={mouth === ch ? 1 : 0} label={t.mouth[mouth].how} />
        </span>
      ) : VOWEL_MOUTHS.has(ch) ? (
        <span className={styles.hintPicture}>
          <VowelMouth ch={ch} label={text} />
        </span>
      ) : null}
      <span className={styles.hintSide}>
        {l.from ? <Grown ch={ch} size={36} /> : null}
        <span className={styles.hintText}>{text}</span>
      </span>
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

/**
 * Two basic vowels side by side, each with its mouth from the front (the two said alike in Japanese told apart by the
 * mouth): said one after the other as the page comes up, each again on a press, both again with 続けて聞く.
 */
export function VowelPairPage({ chs, title, lead }: { chs: string[]; title: string; lead: string }) {
  const playing = usePlaying();
  const [run, setRun] = useState(0);
  useEffect(() => {
    const timers = chs.map((ch, i) => window.setTimeout(() => void say(soundOf(ch), { key: `first:${ch}` }), 900 + i * 1500));
    return () => timers.forEach((x) => window.clearTimeout(x));
    // Said as the page comes up, and again on 続けて聞く.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chs.join(""), run]);
  return (
    <>
      <p className={styles.big}>{title}</p>
      <p className={styles.text}>{lead}</p>
      <ul className={styles.vowelPair}>
        {chs.map((ch) => {
          const v = t.vowels.items.find((x) => x.ch === ch);
          return (
            <li key={ch}>
              <button
                type="button"
                className={styles.vowel}
                data-playing={playing === `first:${ch}` ? "" : undefined}
                onClick={() => void say(soundOf(ch), { key: `first:${ch}` })}
                aria-label={`${ch} ${v?.say ?? ""}`}
              >
                <span className={styles.vowelMouth}>
                  <VowelMouth ch={ch} label={v?.say ?? ch} />
                </span>
                <Letter ch={ch} size={56} />
                <span className={styles.vowelSay}>{v?.say}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className={styles.replayRow}>
        <button
          type="button"
          className="btn-quiet"
          onClick={() => {
            stop();
            setRun((r) => r + 1);
          }}
        >
          <Icon name="speaker" size={18} />
          {t.vowels.both}
        </button>
      </div>
    </>
  );
}

const SIZE = 100;
const APART = 40;

/** A syllable's letters apart in a row or in one square: the parts slide, point for point. Pressed, it says itself. */
function Join({ syl, together, onPress }: { syl: string; together: boolean; onPress: () => void }) {
  const p = syllableParts(syl);
  const width = p.length * SIZE + (p.length - 1) * APART;
  const items: Ink[] = p.flatMap((part, k) => {
    const box: [number, number, number, number] = [k * (SIZE + APART), 0, k * (SIZE + APART) + SIZE, SIZE];
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
    <button type="button" className={styles.join} onClick={onPress} aria-label={`${syl} ${ja.common.hear}`}>
      <InkSvg items={drawn} width={width} height={SIZE} draw={false} label={syl} />
    </button>
  );
}

/** Between one square coming together and the next, and how long a pressed one stays apart (ms). */
const JOIN_STEP = 2200;
const PULL_MS = 700;

/**
 * Letters coming together into squares, one after another, each said as it comes together, `notes` beside each (右に、
 * 下に、ㅇ は音なし) and `after` once all are together. Pressed, a square comes apart and together again and is said.
 */
export function JoinPage({
  syls,
  title,
  lead,
  notes,
  after,
}: {
  syls: string[];
  title: string;
  lead: string;
  notes?: Record<string, string>;
  after?: string;
}) {
  const [run, setRun] = useState(0);
  const [joined, setJoined] = useState(0);
  const [pulled, setPulled] = useState<string | null>(null);
  const pull = useRef<number | null>(null);
  useEffect(() => {
    const timers = syls.map((s, i) =>
      window.setTimeout(() => {
        setJoined(i + 1);
        void say(s, { key: `join:${s}` });
      }, 1200 + i * JOIN_STEP),
    );
    return () => timers.forEach((x) => window.clearTimeout(x));
    // Comes together as the page comes up, and again on もう一度見る.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syls.join(""), run]);
  useEffect(
    () => () => {
      if (pull.current !== null) window.clearTimeout(pull.current);
    },
    [],
  );
  const press = (s: string) => {
    if (pull.current !== null) window.clearTimeout(pull.current);
    setPulled(s);
    pull.current = window.setTimeout(() => {
      setPulled(null);
      void say(s, { key: `join:${s}` });
    }, PULL_MS);
  };
  const all = joined >= syls.length;
  return (
    <>
      <p className={styles.big}>{title}</p>
      <p className={styles.text}>{lead}</p>
      <ul className={styles.joins}>
        {syls.map((s, i) => (
          <li key={s}>
            <Join syl={s} together={i < joined && pulled !== s} onPress={() => press(s)} />
            {notes?.[s] ? (
              <span className={styles.joinNote} data-shown={i < joined ? "" : undefined}>
                {notes[s]}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      {after ? (
        <p className={styles.step} data-shown={all ? "" : undefined}>
          {after}
        </p>
      ) : null}
      <Replay
        shown={all}
        onReplay={() => {
          setJoined(0);
          setRun((r) => r + 1);
        }}
      />
    </>
  );
}

/** Between one square being read and the next (ms). */
const READ_STEP = 1600;

/**
 * A word read one square at a time: each square lit (the rest faint) and said, then the whole word said and its
 * meaning shown. Once through, it can be heard again.
 */
export function StepReadPage({ word, title, lead }: { word: string; title: string; lead: string }) {
  const syls = syllablesOf(word);
  const [run, setRun] = useState(0);
  const [at, setAt] = useState(-1);
  useEffect(() => {
    const timers = [...syls, word].map((s, i) =>
      window.setTimeout(() => {
        setAt(i);
        void say(s, { key: `step:${s}` });
      }, 900 + i * READ_STEP),
    );
    return () => timers.forEach((x) => window.clearTimeout(x));
    // Read as the page comes up, and again on もう一度見る.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word, run]);
  const whole = at >= syls.length;
  const items = syls.flatMap((s, i) => syllableInk(s, { at: i * (SIZE + GAP), prefix: `${i}`, color: whole || i === at ? undefined : FAINT }));
  const width = syls.length * SIZE + (syls.length - 1) * GAP;
  return (
    <>
      <p className={styles.big}>{title}</p>
      <p className={styles.text}>{lead}</p>
      <div className={styles.stepRead}>
        <span className={styles.stepWord}>
          <InkSvg items={items} width={width} height={SIZE} draw={false} label={word} />
        </span>
        <span className={styles.stepMeaning} data-shown={whole ? "" : undefined}>
          {WORD.get(word)?.ja}
        </span>
      </div>
      <Replay
        shown={whole}
        onReplay={() => {
          setAt(-1);
          setRun((r) => r + 1);
        }}
      />
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
