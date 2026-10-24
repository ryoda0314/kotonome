"use client";

// A lesson, page by page (the 90 seconds, and each of the next 90 seconds): the place shown as small marks, 次へ at the
// bottom and back; nothing has to be done before 次へ. The last page's button finishes the lesson.

import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/Icon";
import page from "@/components/page.module.css";
import { stop } from "@/components/sound";
import { ja } from "@/lib/i18n/ja";
import styles from "./lessons.module.css";

export type LessonPage = { key: string; render: () => ReactNode };

export function Lesson({
  title,
  pages,
  finish,
  onFinish,
  aside,
}: {
  title: ReactNode;
  pages: LessonPage[];
  /** The last page's button. */
  finish: string;
  onFinish: () => void;
  /** Beside the title while the lesson is going (とばす, or the way back). */
  aside?: ReactNode;
}) {
  const [at, setAt] = useState(0);
  const last = at === pages.length - 1;
  const go = (to: number) => {
    stop();
    setAt(to);
    window.scrollTo({ top: 0 });
  };
  useEffect(() => () => stop(), []);
  return (
    <div className={page.page}>
      <header className={page.bar}>
        <h1 className={page.barTitle}>{title}</h1>
        <span className={styles.pageOf}>{ja.first.pageOf(at + 1, pages.length)}</span>
        {last ? null : aside}
      </header>
      <ol className={styles.dots} aria-hidden="true">
        {pages.map((p, i) => (
          <li key={p.key} data-state={i < at ? "done" : i === at ? "now" : "next"} />
        ))}
      </ol>
      <section className={styles.body} key={pages[at].key}>
        {pages[at].render()}
      </section>
      <footer className={styles.foot}>
        {at > 0 ? (
          <button type="button" className="btn-quiet" onClick={() => go(at - 1)} aria-label={ja.common.back}>
            <Icon name="back" size={18} />
          </button>
        ) : null}
        <button type="button" className="btn" onClick={() => (last ? onFinish() : go(at + 1))}>
          {last ? finish : ja.common.next}
          <Icon name="arrow" size={18} />
        </button>
      </footer>
    </div>
  );
}
