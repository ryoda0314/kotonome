"use client";

// 気づく: the words of this rain that hold the new one, side by side with it lit. Hear them and guess what it says;
// the 答え合わせ comes after (CONCEPT.md: 説明は答え合わせ), with words one letter apart to hear side by side. Right
// after it, the new one is practised many times (原則2): its sound among the letters it is told from, or for パッチム
// words told apart by the letter under the vowel. By the end of it the new one has been met.

import { useState } from "react";
import { Letter, Word } from "@/components/Glyph";
import { Grown } from "@/components/Grown";
import { Icon } from "@/components/Icon";
import { useOpenLetter } from "@/components/LetterSheet";
import { Speak } from "@/components/Speak";
import { say, usePlaying } from "@/components/sound";
import { pairsFor } from "@/content/pairs";
import { WORD, type Word as W } from "@/content/words";
import { LETTER, lettersOf, needsOf, PATCHIM, SAID, saidApart, soundOf } from "@/lib/hangul";
import { ja } from "@/lib/i18n/ja";
import { practiceFor } from "@/lib/practice";
import { canRead, meetLetters } from "@/lib/record";
import { commit } from "@/lib/store";
import { Compare } from "../_parts/Compare";
import { Practice } from "../_parts/Practice";
import parts from "../_parts/parts.module.css";

/** Where the new one is in a word, as the squares' parts to light ("1:cho"). */
function marksOf(w: W, fresh: string): Set<string> {
  if (fresh === SAID) return new Set(saidApart(w.ko, w.say ?? "").flatMap((i) => [`${i}:cho`, `${i}:jung`, `${i}:jong`]));
  const letters = lettersOf(w.ko);
  if (fresh === PATCHIM) return new Set(letters.filter((l) => l.role === "jong").map((l) => `${l.at}:jong`));
  return new Set(letters.filter((l) => l.ch === fresh).map((l) => `${l.at}:${l.role}`));
}

export function Notice({ fresh, words, known, onDone }: { fresh: string; words: W[]; known: ReadonlySet<string>; onDone: () => void }) {
  const [heard, setHeard] = useState<Set<string>>(new Set());
  const [revealed, setRevealed] = useState(false);
  const [stage, setStage] = useState<"notice" | "practice">("notice");
  const [practised, setPractised] = useState(false);
  const playing = usePlaying();
  const openLetter = useOpenLetter();
  const holding = words.filter((w) => needsOf(w).includes(fresh)).slice(0, 3);
  const withFresh = new Set(known).add(fresh);
  const groups = pairsFor(fresh, (ko) => canRead(WORD.get(ko) ?? { ko }, withFresh)).slice(0, 2);
  const letter = LETTER.get(fresh);
  const t = ja.rain.notice;

  const meet = () => commit((s) => meetLetters(s, [fresh], Date.now()));
  const items = practiceFor(fresh, withFresh);

  if (stage === "practice") {
    const p = ja.practice;
    return (
      <div className={parts.notice}>
        <p className={parts.practiceTitle}>{p.title}</p>
        <p className={parts.lead}>{fresh === PATCHIM ? p.patchimLead : p.letterLead}</p>
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
          hint={(id) => {
            const l = LETTER.get(id);
            return <p className={parts.answerNote}>{l ? p.letterHint(l.anchor, l.how) : p.patchimHint}</p>;
          }}
          done={<p className={parts.answerNote}>{p.done}</p>}
          onFinished={() => setPractised(true)}
        />
        <div className={parts.actions}>
          <button type="button" className={practised ? "btn" : "btn-quiet"} onClick={onDone}>
            {ja.common.next}
            <Icon name="arrow" size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={parts.notice}>
      <p className={parts.lead}>{fresh === PATCHIM ? t.patchim : fresh === SAID ? t.said : t.letter}</p>
      <ul className={parts.seen}>
        {holding.map((w, i) => (
          <li key={w.ko}>
            <button
              type="button"
              className={parts.seenWord}
              style={{ animationDelay: `${i * 0.15}s` }}
              data-playing={playing === `notice:${w.ko}` ? "" : undefined}
              onClick={() => {
                void say(w.ko, { key: `notice:${w.ko}` });
                setHeard((h) => new Set(h).add(w.ko));
              }}
              aria-label={`${w.ko} ${ja.common.hear}`}
            >
              <Word text={w.ko} height={56} color="var(--ink)" marks={marksOf(w, fresh)} fit />
              <span className={parts.seenMeaning}>{heard.has(w.ko) ? w.ja : " "}</span>
            </button>
          </li>
        ))}
      </ul>

      {revealed ? (
        <section className={parts.answer}>
          {letter ? (
            <>
              <div className={parts.answerHead}>
                <Letter ch={fresh} size={96} draw />
                <div className={parts.answerText}>
                  <p className={parts.answerAnchor}>
                    {letter.anchor}
                    {letter.how ? <span className={parts.answerHow}>{letter.how}</span> : null}
                  </p>
                  <span className={parts.answerSound}>
                    <Speak text={soundOf(fresh)} label={ja.common.hear} id={`notice:sound:${fresh}`} />
                    <span className="t-ko">{soundOf(fresh)}</span>
                  </span>
                </div>
              </div>
              <Grown ch={fresh} />
              <p className={parts.answerNote}>{letter.shape}</p>
            </>
          ) : fresh === PATCHIM ? (
            <>
              <p className={parts.answerNote}>{ja.letter.patchim.lead}</p>
              <p className={parts.answerNote}>{ja.letter.patchim.seven}</p>
            </>
          ) : (
            <>
              <p className={parts.answerNote}>{ja.letter.said.lead}</p>
              <ul className={parts.saidList}>
                {holding.map((w) => (
                  <li key={w.ko}>
                    <Speak text={w.ko} label={`${w.ko} ${ja.common.hear}`} size="sm" id={`said:${w.ko}`} />
                    <Word text={w.ko} height={30} />
                    <span className={parts.saidAs}>［{w.say}］</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <Compare groups={groups} />
          <div className={parts.actions}>
            <button type="button" className="link-button" onClick={() => openLetter(fresh)}>
              {letter ? t.more.letter : fresh === PATCHIM ? t.more.patchim : t.more.said}
            </button>
          </div>
        </section>
      ) : null}

      <div className={parts.actions}>
        {revealed ? null : (
          <button
            type="button"
            className="btn-quiet"
            onClick={() => {
              setRevealed(true);
              meet();
            }}
          >
            {t.reveal}
          </button>
        )}
        <button
          type="button"
          className={revealed ? "btn" : "btn-quiet"}
          onClick={() => {
            meet();
            if (items.length) {
              setStage("practice");
              window.scrollTo({ top: 0 });
            } else onDone();
          }}
        >
          {ja.common.next}
          <Icon name="arrow" size={18} />
        </button>
      </div>
    </div>
  );
}
