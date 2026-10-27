"use client";

// 練習 on screen (src/lib/practice.ts makes the goes): a sound is said; press its letter or word. A right press lights
// and the next comes; a wrong one is only marked, a hint shows (the mouth, the row of kana), the sound is said again,
// and that go comes once more a little later. Many goes, nothing counted; at the end it can be done again at once.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { narrate, say, usePlaying } from "@/components/sound";
import { ja } from "@/lib/i18n/ja";
import { again, type PracticeItem } from "@/lib/practice";
import styles from "./practice.module.css";

const columns = (n: number) => (n <= 5 ? n : 3);

export function Practice({
  items,
  face,
  hint,
  done,
  onFinished,
  hintVoice,
}: {
  items: PracticeItem[];
  /** How a choice is drawn (a letter, a word); `lit` when it is the one just pressed right. */
  face: (id: string, lit: boolean) => ReactNode;
  /** Shown after a wrong press, to find it again. */
  hint?: (answer: string) => ReactNode;
  /** Shown when every go is through. */
  done: ReactNode;
  /** Every go is through (the first time). */
  onFinished?: () => void;
  /** A line of narration said with the hint after a miss, before the sound comes again (最初の16字). */
  hintVoice?: (answer: string) => string | undefined;
}) {
  const [queue, setQueue] = useState(items);
  const [i, setI] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const [right, setRight] = useState(false);
  const timer = useRef<number | null>(null);
  /** The go whose hint is being said (its sound comes after it, only while it is still the go). */
  const current = useRef<PracticeItem | null>(null);
  const playing = usePlaying();
  const go = queue[i];
  const finished = i >= queue.length;

  useEffect(() => {
    if (!go) return;
    const t = window.setTimeout(() => void say(go.say, { key: "practice" }), 450);
    return () => window.clearTimeout(t);
  }, [go]);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const press = (id: string) => {
    if (!go || right) return;
    if (id !== go.answer) {
      // The first miss of a go brings it back once more, a little later.
      if (!wrong.length) setQueue(again(queue, i));
      setWrong((w) => (w.includes(id) ? w : [...w, id]));
      const line = !wrong.length ? hintVoice?.(go.answer) : undefined;
      if (line) {
        // The hint said, then the sound again, unless the learner has gone on meanwhile.
        current.current = go;
        void narrate(line).then(() => {
          if (current.current === go) void say(go.say, { key: "practice" });
        });
      } else {
        current.current = null;
        void say(go.say, { key: "practice" });
      }
      return;
    }
    current.current = null;
    setRight(true);
    const last = i + 1 >= queue.length;
    timer.current = window.setTimeout(() => {
      setRight(false);
      setWrong([]);
      setI((x) => x + 1);
      if (last) onFinished?.();
    }, 800);
  };

  if (finished) {
    return (
      <div className={styles.done}>
        {done}
        <div>
          <button
            type="button"
            className="btn-quiet"
            onClick={() => {
              setQueue(items);
              setI(0);
            }}
          >
            <Icon name="replay" size={18} />
            {ja.practice.again}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.practice}>
      <div className={styles.head}>
        <button
          type="button"
          className={styles.listen}
          data-playing={playing === "practice" ? "" : undefined}
          onClick={() => void say(go.say, { key: "practice" })}
          aria-label={ja.common.hearAgain}
        >
          <Icon name="speaker" size={30} />
        </button>
        <span className={styles.count}>{ja.common.countOf(i + 1, queue.length)}</span>
      </div>
      <ul className={styles.choices} style={{ gridTemplateColumns: `repeat(${columns(go.choices.length)}, minmax(0, 1fr))` }}>
        {go.choices.map((id) => (
          <li key={id}>
            <button
              type="button"
              className={styles.choice}
              data-state={right && id === go.answer ? "right" : wrong.includes(id) ? "wrong" : undefined}
              onClick={() => press(id)}
              aria-label={id}
            >
              {face(id, right && id === go.answer)}
            </button>
          </li>
        ))}
      </ul>
      <div className={styles.hint} aria-live="polite">
        {right ? <p className={styles.right}>{ja.practice.right}</p> : wrong.length && hint ? hint(go.answer) : null}
      </div>
    </div>
  );
}
