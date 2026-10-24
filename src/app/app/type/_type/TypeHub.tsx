"use client";

// 打つ: the standard Korean keyboard, learned the way the author did on 한컴타자연습 — where the keys are, a row at a
// time; then words; then short sentences; and, beside them, typing anything to hear how it sounds.

import Link from "next/link";
import { Icon } from "@/components/Icon";
import page from "@/components/page.module.css";
import { ja } from "@/lib/i18n/ja";
import { useRecord } from "@/lib/store";
import { DRILLS } from "@/lib/typing-core";
import styles from "./type.module.css";

const t = ja.type;

export function TypeHub() {
  const state = useRecord();
  return (
    <div className={page.page}>
      <header className={page.bar}>
        <h1 className={page.barTitle}>{t.title}</h1>
      </header>
      <p className={page.lead}>{t.lead}</p>
      <p className={styles.physical}>{ja.typing.physical}</p>

      <section className={page.section}>
        <h2 className={page.h2}>{t.keys}</h2>
        <p className={page.note}>{t.keysLead}</p>
        <ol className={styles.drills}>
          {DRILLS.map((d) => {
            const n = state?.drills[d.id]?.length ?? 0;
            return (
              <li key={d.id}>
                <Link href={`/app/type/keys/${d.id}`} className={page.row}>
                  <span className={page.rowMain}>
                    <span className={page.rowTitle}>{t.drills[d.id].name}</span>
                    <span className={`t-ko ${page.rowSub}`}>{t.drills[d.id].lead}</span>
                  </span>
                  {n ? <span className={page.met}>{t.rounds(n)}</span> : null}
                  <Icon name="arrow" size={18} />
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <section className={page.section}>
        <ul className={page.cards}>
          {[
            { href: "/app/type/words", title: t.words, lead: t.wordsLead },
            { href: "/app/type/lines", title: t.lines, lead: t.linesLead },
            { href: "/app/type/free", title: t.free, lead: t.freeLead },
          ].map((c) => (
            <li key={c.href}>
              <Link href={c.href} className={page.card}>
                <span className={page.cardTitle}>{c.title}</span>
                <span className={page.cardLead}>{c.lead}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
