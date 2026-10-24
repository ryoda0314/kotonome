"use client";

// The 두벌식 keyboard on screen (src/lib/dubeol.ts is what the keys make). On a computer the keyboard in front of the
// learner types too, by the keys' places (KeyQ is ㅂ whatever is printed on it, as 한컴타자연습 is used with a Japanese
// or English keyboard); a key pressed there lights here for a moment, so the eyes learn where the fingers are.
//
//   ㅂ ㅈ ㄷ ㄱ ㅅ ㅛ ㅕ ㅑ ㅐ ㅔ
//    ㅁ ㄴ ㅇ ㄹ ㅎ ㅗ ㅓ ㅏ ㅣ
//   ⇧ ㅋ ㅌ ㅊ ㅍ ㅠ ㅜ ㅡ ⌫
//         [   space   ]
//
// The key to press next can be lit (案内), and the letters not in use can be faint ("最初は使う字だけ光らせる"):
// every key can still be pressed, and the keyboard never rearranges itself.

import { useEffect, useEffectEvent, useState } from "react";
import { jamoOf, KEY_OF, ROWS, isVowelKey, type KeyDef } from "@/lib/dubeol";
import { ja } from "@/lib/i18n/ja";
import { Icon } from "./Icon";
import styles from "./Keyboard.module.css";

/**
 * A key on screen never takes the focus (a press on a phone acts at once; and a space typed on the keyboard in front
 * of the learner must not press again the key last clicked on screen).
 */
const keepFocus = (e: React.PointerEvent | React.MouseEvent) => e.preventDefault();

/** True while a sheet (a letter's page) is open over the page: the keys in front of the learner are left to it. */
const covered = () => typeof document !== "undefined" && !!document.querySelector("dialog[open]");

export function Keyboard({
  onKey,
  onBack,
  onEnter,
  next,
  lit,
  listen = true,
}: {
  onKey: (jamo: string) => void;
  onBack: () => void;
  onEnter?: () => void;
  /** The key the guide points at: a letter, " " for the space bar, or "⌫". */
  next?: string | null;
  /** The letters in use; the rest are faint. */
  lit?: ReadonlySet<string> | null;
  /** Take the keys of the keyboard in front of the learner too. */
  listen?: boolean;
}) {
  const [shift, setShift] = useState(false);
  const [pressed, setPressed] = useState<string | null>(null);

  const press = (k: KeyDef, withShift: boolean) => {
    onKey(withShift && k.shifted ? k.shifted : k.jamo);
    setShift(false);
  };

  const onDown = useEffectEvent((e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey || covered()) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    if (e.code === "Backspace") {
      e.preventDefault();
      onBack();
    } else if (e.code === "Space") {
      e.preventDefault();
      onKey(" ");
    } else if (e.code === "Enter" || e.code === "NumpadEnter") {
      if (!onEnter) return;
      e.preventDefault();
      onEnter();
    } else {
      const jamo = jamoOf(e.code, e.shiftKey);
      if (!jamo) return;
      e.preventDefault();
      onKey(jamo);
    }
    setPressed(e.code);
  });

  useEffect(() => {
    if (!listen) return;
    const down = (e: KeyboardEvent) => onDown(e);
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [listen]);

  useEffect(() => {
    if (!pressed) return;
    const t = window.setTimeout(() => setPressed(null), 160);
    return () => window.clearTimeout(t);
  }, [pressed]);

  const guide = next && next !== "⌫" && next !== " " ? KEY_OF.get(next) : undefined;
  const needShift = !!guide?.shift && !shift;
  const inUse = (k: KeyDef) => !lit || lit.has(k.jamo) || (!!k.shifted && lit.has(k.shifted));

  const letterKey = (k: KeyDef) => {
    const face = shift && k.shifted ? k.shifted : k.jamo;
    const isNext = guide?.code === k.code;
    return (
      <button
        key={k.code}
        type="button"
        className={[
          styles.key,
          isVowelKey(k.jamo) ? styles.vowel : styles.cons,
          isNext ? styles.next : "",
          !inUse(k) && !isNext ? styles.faint : "",
          pressed === k.code ? styles.pressed : "",
        ].join(" ")}
        aria-label={face}
        onPointerDown={keepFocus}
        onMouseDown={keepFocus}
        onClick={() => press(k, shift)}
      >
        <span className="t-ko">{face}</span>
      </button>
    );
  };

  return (
    <div className={styles.keys} role="group" aria-label={ja.typing.keyboard}>
      {ROWS[0].map(letterKey)}
      <span className={styles.indent} aria-hidden="true" />
      {ROWS[1].map(letterKey)}
      <button
        type="button"
        className={[styles.key, styles.wide, styles.mod, shift ? styles.on : "", needShift ? styles.next : ""].join(" ")}
        aria-label={ja.typing.shift}
        aria-pressed={shift}
        onPointerDown={keepFocus}
        onMouseDown={keepFocus}
        onClick={() => setShift(!shift)}
      >
        <Icon name="shift" size={20} />
      </button>
      {ROWS[2].map(letterKey)}
      <button
        type="button"
        className={[styles.key, styles.wide, styles.mod, next === "⌫" ? styles.next : "", pressed === "Backspace" ? styles.pressed : ""].join(" ")}
        aria-label={ja.typing.back}
        onPointerDown={keepFocus}
        onMouseDown={keepFocus}
        onClick={onBack}
      >
        <Icon name="erase" size={22} />
      </button>
      <button
        type="button"
        className={[styles.key, styles.space, styles.mod, next === " " ? styles.next : "", pressed === "Space" ? styles.pressed : ""].join(" ")}
        aria-label={ja.typing.space}
        onPointerDown={keepFocus}
        onMouseDown={keepFocus}
        onClick={() => onKey(" ")}
      >
        <span className={styles.spaceLabel}>{ja.typing.space}</span>
      </button>
    </div>
  );
}

/** The keyboard drawn small and still, with some keys lit: where a letter is (the letter's sheet). */
export function KeyMap({ lit, shift = false }: { lit: string[]; shift?: boolean }) {
  const on = new Set(lit.map((j) => KEY_OF.get(j)?.code));
  const cell = (k: KeyDef) => (
    <span key={k.code} className={[styles.mapKey, on.has(k.code) ? styles.mapOn : ""].join(" ")}>
      <span className="t-ko">{on.has(k.code) && shift && k.shifted ? k.shifted : k.jamo}</span>
    </span>
  );
  return (
    <span className={styles.map} aria-hidden="true">
      {ROWS[0].map(cell)}
      <span className={styles.indent} />
      {ROWS[1].map(cell)}
      <span className={[styles.mapKey, styles.mapWide, shift ? styles.mapOn : ""].join(" ")}>
        <Icon name="shift" size={12} />
      </span>
      {ROWS[2].map(cell)}
    </span>
  );
}
