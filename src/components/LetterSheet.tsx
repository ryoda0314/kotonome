"use client";

// その場で: a letter, or パッチム, or 発音, opened where it was met: a word's letters, a dotted syllable in a sentence,
// 自分. How it sounds, what its shape is, where it is on the keyboard, and other words it is in, to meet it again there.
// Opening it is meeting it (CONCEPT.md: 知らない字は押せばその場で分かる). Over the page as a sheet, so whatever was
// underneath (a rain, a half-typed word) stays as it was.

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { WORDS, type Word as W } from "@/content/words";
import { KEY_OF, keysOfLetter } from "@/lib/dubeol";
import { FIRST_LETTERS, LETTER, lettersOf, needsOf, PATCHIM, SAID, soundOf } from "@/lib/hangul";
import { ja } from "@/lib/i18n/ja";
import { dayOf, isOwed, knownSet, meetLetters, unknownIn } from "@/lib/record";
import { commit, useRecord } from "@/lib/store";
import { Letter, Word } from "./Glyph";
import { Grown } from "./Grown";
import { KeyMap } from "./Keyboard";
import { Sheet } from "./Sheet";
import { Speak } from "./Speak";
import styles from "./LetterSheet.module.css";

type OpenOptions = {
  /** The other letters met in the same place (a syllable of a sentence), to look at in turn. */
  among?: string[];
  /** Opened where it was met (a word, a sentence) it is met; looked up from 自分's table it is only looked at. */
  meet?: boolean;
};
const Open = createContext<(ch: string, opts?: OpenOptions) => void>(() => undefined);
export const useOpenLetter = () => useContext(Open);

const nameOf = (ch: string) => (ch === PATCHIM ? ja.letter.patchim.title : ch === SAID ? ja.letter.said.title : ch);

export function LetterHost({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<{ ch: string; among: string[]; meet: boolean } | null>(null);
  const show = useCallback((ch: string, { among, meet = true }: OpenOptions = {}) => {
    setOpen({ ch, among: among && among.length > 1 ? among : [ch], meet });
    if (meet) commit((s) => meetLetters(s, [ch], Date.now()));
  }, []);
  return (
    <Open.Provider value={show}>
      {children}
      <Sheet open={open !== null} onClose={() => setOpen(null)} title={open ? <SheetTitle ch={open.ch} /> : null} closeLabel={ja.common.close}>
        {open ? (
          <>
            {open.among.length > 1 ? (
              <p className={styles.among}>
                {open.among.map((x) => (
                  <button key={x} type="button" className={`t-ko ${styles.amongChip}`} aria-pressed={x === open.ch} onClick={() => show(x, open)}>
                    {nameOf(x)}
                  </button>
                ))}
              </p>
            ) : null}
            {open.ch === PATCHIM ? <PatchimBody /> : open.ch === SAID ? <SaidBody /> : <LetterBody ch={open.ch} key={open.ch} />}
          </>
        ) : null}
      </Sheet>
    </Open.Provider>
  );
}

function SheetTitle({ ch }: { ch: string }) {
  const l = LETTER.get(ch);
  if (!l) return <span className={styles.title}><span className={styles.titleCh}>{nameOf(ch)}</span></span>;
  return (
    <span className={styles.title}>
      <span className={styles.titleKind}>{ja.letter.kind[l.kind]}</span>
      <span className={`t-ko ${styles.titleCh}`}>{ch}</span>
    </span>
  );
}

/** A word with its sound and meaning, in a line. */
function Line({ w, id }: { w: W; id: string }) {
  return (
    <li>
      <Speak text={w.ko} label={`${w.ko} ${ja.common.hear}`} size="sm" id={id} />
      <Word text={w.ko} height={30} />
      <span className={styles.meaning}>
        {w.ja}
        {w.say ? <span className={`t-ko ${styles.said}`}>［{w.say}］</span> : null}
      </span>
    </li>
  );
}

/** Words holding `has`, those the learner can read (with it) first, then those with the fewest things not met yet. */
function wordsWith(has: (w: W) => boolean, known: ReadonlySet<string>, n = 8): W[] {
  return WORDS.filter(has)
    .map((w) => ({ w, unknown: unknownIn(w, known).length }))
    .sort((a, b) => a.unknown - b.unknown || [...a.w.ko].length - [...b.w.ko].length)
    .slice(0, n)
    .map((x) => x.w);
}

function LetterBody({ ch }: { ch: string }) {
  const state = useRecord();
  const l = LETTER.get(ch);
  if (!l || !state) return null;
  const known = knownSet(state);
  known.add(ch);
  const words = wordsWith((w) => lettersOf(w.ko).some((x) => x.ch === ch), known);
  const sound = soundOf(ch);
  const owed = isOwed(state, ch);
  const met = state.letters[ch]?.met;
  const mixedTimes = state.letters[ch]?.mixed.length ?? 0;
  // Where it is typed: its own key (with Shift), or two keys one after the other (ㅘ: ㅗ then ㅏ).
  const keys = keysOfLetter(ch);
  const key = KEY_OF.get(keys[0]);
  const two = keys.length === 2 ? keys : undefined;
  return (
    <>
      <div className={styles.head}>
        <Letter ch={ch} size={112} draw />
        <div className={styles.headText}>
          <p className={styles.anchor}>
            {l.anchor}
            {l.how ? <span className={styles.how}>{l.how}</span> : null}
          </p>
          <div className={styles.sound}>
            <Speak text={sound} label={ja.common.hear} id={`sheet:${ch}`} />
            <span className={`t-ko ${styles.soundText}`}>{sound}</span>
          </div>
        </div>
      </div>
      <Grown ch={ch} size={36} />
      <p className={styles.text}>{l.shape}</p>

      <section className={styles.section}>
        <h3 className={styles.h3}>{ja.letter.keys}</h3>
        <div className={styles.keys}>
          <KeyMap lit={keys} shift={!!key?.shift} />
          <p className={styles.keysNote}>
            {two ? ja.letter.twoKeys(two[0], two[1]) : key?.shift ? ja.letter.shiftKey(key.face) : ja.typing.fingers[key?.finger ?? ""]}
          </p>
        </div>
      </section>

      {owed ? <p className={styles.owed}>{ja.letter.owed}</p> : null}
      <p className={styles.met}>
        {FIRST_LETTERS.includes(ch) ? ja.letter.first : met ? ja.letter.met(dayOf(met)) : ""}
        {mixedTimes ? `・${ja.letter.mixed(mixedTimes)}` : ""}
      </p>

      {words.length ? (
        <section className={styles.section}>
          <h3 className={styles.h3}>{ja.letter.words}</h3>
          <ul className={styles.words}>
            {words.map((w) => (
              <Line key={w.ko} w={w} id={`sheetw:${w.ko}`} />
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

function PatchimBody() {
  const t = ja.letter.patchim;
  const state = useRecord();
  if (!state) return null;
  const known = knownSet(state);
  known.add(PATCHIM);
  return (
    <>
      <p className={styles.text}>{t.lead}</p>
      <section className={styles.section}>
        <h3 className={styles.h3}>{t.seven}</h3>
        <ul className={styles.groups}>
          {t.groups.map((g) => (
            <li key={g.sound}>
              <span className={styles.groupSound}>{g.sound}</span>
              <span className={styles.groupMain}>
                <span className={styles.groupNote}>{g.note}</span>
                <span className={styles.groupWords}>
                  {g.words.map((ko) => (
                    <span key={ko} className={styles.groupWord}>
                      <Speak text={ko} label={`${ko} ${ja.common.hear}`} size="sm" id={`patchim:${ko}`} />
                      <Word text={ko} height={28} />
                    </span>
                  ))}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section className={styles.section}>
        <h3 className={styles.h3}>{ja.letter.otherWords}</h3>
        <ul className={styles.words}>
          {wordsWith((w) => needsOf(w).includes(PATCHIM) && !w.say, known).map((w) => (
            <Line key={w.ko} w={w} id={`sheetw:${w.ko}`} />
          ))}
        </ul>
      </section>
    </>
  );
}

function SaidBody() {
  const state = useRecord();
  if (!state) return null;
  const known = knownSet(state);
  known.add(SAID);
  return (
    <>
      <p className={styles.text}>{ja.letter.said.lead}</p>
      <section className={styles.section}>
        <h3 className={styles.h3}>{ja.letter.otherWords}</h3>
        <ul className={styles.words}>
          {wordsWith((w) => needsOf(w).includes(SAID), known, 10).map((w) => (
            <Line key={w.ko} w={w} id={`sheetw:${w.ko}`} />
          ))}
        </ul>
      </section>
    </>
  );
}
