"use client";

// 打ってみる: a word or a sentence to type on the 두벌식 keyboard, as 한컴타자연습's word and short-text practice: the
// text above, what has been typed under it, the key to press next lit (案内) with the finger for it. A key off the way
// turns what it made violet, and the way back is ⌫; nothing is blocked or counted. Done when every key is in: it is
// said (音で確かめる) and its meaning shows. The letters where it went off the way are noted, to come back (また出会う).

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { back, composing, emptyKb, guide, isDone, KEY_OF, keysFor, press, textOf, typeKeys, type Kb } from "@/lib/dubeol";
import { ja } from "@/lib/i18n/ja";
import { Word } from "./Glyph";
import { Icon } from "./Icon";
import { Keyboard } from "./Keyboard";
import { KoText } from "./KoText";
import { usePref } from "./local";
import { play, stop as stopClip } from "./player";
import { say, stop, usePlaying } from "./sound";
import styles from "./TypeLine.module.css";

export type TypeResult = { mixed: string[] };

/** The longest stretch two texts share from the start. */
const sharedStart = (a: string, b: string) => {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
};

export function TypeLine({
  target,
  meaning,
  audio,
  view = "word",
  hearFirst = false,
  auto = false,
  known,
  onTyped,
  onDone,
}: {
  /** The text as it is shown (punctuation is shown, never typed). */
  target: string;
  meaning?: string;
  /** A sentence's clip (ことのあめ's); a word is said from its own clip. */
  audio?: string;
  view?: "word" | "line";
  /** Say it as it comes up: hear, then type. */
  hearFirst?: boolean;
  /** Move on by itself once it is done (a round of words); otherwise 次へ. */
  auto?: boolean;
  /** For a sentence: dot the syllables holding letters not met yet. */
  known?: ReadonlySet<string>;
  /** Every key is in: kept at once, whether or not the learner moves on. */
  onTyped?: (r: TypeResult) => void;
  /** On to the next. */
  onDone: (r: TypeResult) => void;
}) {
  const [kb, setKb] = useState<Kb>(emptyKb);
  const [done, setDone] = useState(false);
  const [guideOn, setGuideOn] = usePref("guide", true);
  const mixed = useRef(new Set<string>());
  const moved = useRef(false);
  const playing = usePlaying();
  const [clipPlaying, setClipPlaying] = useState(false);
  const plan = keysFor(target);
  const g = guide(kb, plan);
  const id = `type:${target}`;

  const hear = () => {
    if (audio) {
      stop();
      setClipPlaying(true);
      void play(audio).then(() => setClipPlaying(false));
    } else void say(target, { key: id });
  };

  const finish = () => {
    if (moved.current) return;
    moved.current = true;
    onDone({ mixed: [...mixed.current] });
  };

  const hearNow = useEffectEvent(hear);
  const finishNow = useEffectEvent(finish);

  useEffect(() => {
    if (!hearFirst) return;
    const t = window.setTimeout(() => hearNow(), 350);
    return () => window.clearTimeout(t);
  }, [hearFirst]);

  useEffect(
    () => () => {
      stop();
      stopClip();
    },
    [],
  );

  // Once done: a round moves on by itself; otherwise 次へ, or Enter on the keyboard in front of the learner.
  useEffect(() => {
    if (!done) return;
    if (auto) {
      const t = window.setTimeout(() => finishNow(), 1300);
      return () => window.clearTimeout(t);
    }
    const onEnter = (e: KeyboardEvent) => {
      if ((e.code !== "Enter" && e.code !== "NumpadEnter") || document.querySelector("dialog[open]")) return;
      e.preventDefault();
      finishNow();
    };
    window.addEventListener("keydown", onEnter);
    return () => window.removeEventListener("keydown", onEnter);
  }, [done, auto]);

  const onKey = (k: string) => {
    if (done) return;
    const next = press(kb, k);
    const after = guide(next, plan);
    // Off the way just now: the letter that should have come is noted once.
    if (after.back > 0 && g.back === 0 && after.missed && after.missed.letter !== " ") mixed.current.add(after.missed.letter);
    setKb(next);
    if (isDone(next, plan)) {
      setDone(true);
      hear();
      onTyped?.({ mixed: [...mixed.current] });
    }
  };

  // What has been typed: on the way in ink (the syllable still being made underlined), off the way in violet.
  const typed = textOf(kb);
  const cut = g.back ? sharedStart(textOf(typeKeys(kb.keys.slice(0, g.ok))), typed) : done ? typed.length : typed.length - composing(kb).length;
  const nextKey = done ? null : g.back ? "⌫" : (g.next?.key ?? null);
  const finger = nextKey && nextKey !== "⌫" ? (nextKey === " " ? ja.typing.space : ja.typing.fingers[KEY_OF.get(nextKey)?.finger ?? ""]) : null;
  const shifted = nextKey ? !!KEY_OF.get(nextKey)?.shift : false;
  const sounding = audio ? clipPlaying : playing === id;

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <button type="button" className={styles.speak} data-playing={sounding ? "" : undefined} onClick={hear} aria-label={ja.common.hearAgain}>
          <Icon name="speaker" size={20} />
        </button>
        <p className={styles.meaning}>{meaning}</p>
        <button type="button" className={styles.guide} aria-pressed={guideOn} onClick={() => setGuideOn(!guideOn)}>
          <Icon name="hint" size={17} />
          {ja.typing.guide}
        </button>
      </div>

      <div className={styles.target} data-view={view}>
        {view === "word" ? <Word text={target} height={60} fit /> : <KoText text={target} known={known} className={styles.line} />}
      </div>

      <div className={styles.field} data-done={done ? "" : undefined} data-view={view} aria-live="polite">
        {typed ? (
          <span className={`t-ko ${styles.typed}`} lang="ko">
            {g.back ? (
              <>
                {typed.slice(0, cut)}
                <span className={styles.off}>{typed.slice(cut)}</span>
              </>
            ) : (
              <>
                {typed.slice(0, cut)}
                <span className={styles.making}>{typed.slice(cut)}</span>
              </>
            )}
            {!done ? <span className={styles.caret} aria-hidden="true" /> : null}
          </span>
        ) : (
          <span className={styles.placeholder}>
            <span className={styles.caret} aria-hidden="true" />
            {ja.typing.placeholder}
          </span>
        )}
      </div>

      <p className={styles.status} data-state={done ? "done" : g.back ? "off" : undefined}>
        {done ? (
          <>
            <Icon name="check" size={18} />
            {ja.typing.right}
          </>
        ) : g.back ? (
          ja.typing.toBack(g.back)
        ) : guideOn && finger ? (
          shifted ? `${finger}・${ja.typing.withShift}` : finger
        ) : (
          " "
        )}
      </p>

      {done && !auto ? (
        <div className={styles.actions}>
          <button type="button" className="btn" onClick={finish}>
            {ja.common.next}
            <Icon name="arrow" size={18} />
          </button>
        </div>
      ) : (
        <Keyboard
          onKey={onKey}
          onBack={() => setKb(back(kb))}
          next={guideOn ? nextKey : null}
          lit={guideOn ? new Set(plan.map((p) => p.key)) : null}
        />
      )}
    </div>
  );
}
