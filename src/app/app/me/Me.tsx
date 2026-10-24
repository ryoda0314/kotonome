"use client";

// 自分: looking back. The letters as they stand for this learner (not met yet, met, coming back): the 90 seconds'
// first, then the rest in the order the rains bring them; the days; the 90 seconds again; the record's text and the
// settings. Counts are the learner's own, never compared.

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { Letter } from "@/components/Glyph";
import { Icon } from "@/components/Icon";
import { useOpenLetter } from "@/components/LetterSheet";
import page from "@/components/page.module.css";
import { ja } from "@/lib/i18n/ja";
import { FIRST_LETTERS, LETTER, MEET_ORDER, PATCHIM } from "@/lib/hangul";
import { LESSON_IDS } from "@/lib/lessons";
import { dayOf, isOwed, knownSet } from "@/lib/record";
import { useRecord } from "@/lib/store";
import styles from "./me.module.css";

const t = ja.me;

function dayLabel(day: string, today: string): string {
  if (today && day === today) return t.today;
  if (today && day === dayOf(Date.parse(`${today}T12:00:00+09:00`) - 86_400_000)) return t.yesterday;
  return new Intl.DateTimeFormat("ja-JP", { month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Tokyo" }).format(new Date(`${day}T12:00:00+09:00`));
}

const never = () => () => undefined;
/** Today in Japan, read on the device (empty on the server). */
function useToday(): string {
  return useSyncExternalStore(never, () => dayOf(Date.now()), () => "");
}

export function Me() {
  const state = useRecord();
  const today = useToday();
  const open = useOpenLetter();
  const days = useMemo(() => {
    if (!state) return [];
    const m = new Map<string, { rains: number; words: Set<string>; met: Set<string>; mixed: Set<string> }>();
    for (const r of state.rains) {
      const d = dayOf(r.at);
      const e = m.get(d) ?? { rains: 0, words: new Set<string>(), met: new Set<string>(), mixed: new Set<string>() };
      e.rains++;
      r.words.forEach((w) => e.words.add(w));
      r.met.forEach((x) => e.met.add(x));
      r.mixed.forEach((x) => e.mixed.add(x));
      m.set(d, e);
    }
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 30);
  }, [state]);

  if (!state) {
    return (
      <div className={page.page}>
        <header className={page.bar}>
          <h1 className={page.barTitle}>{t.title}</h1>
        </header>
        <p className={page.skeleton}>{ja.common.loading}</p>
      </div>
    );
  }

  const known = knownSet(state);
  const stats = [
    { label: t.stats.letters, value: `${[...known].filter((x) => LETTER.has(x)).length}` },
    { label: t.stats.words, value: `${Object.values(state.words).filter((w) => w.read.length).length}` },
    { label: t.stats.typed, value: `${Object.values(state.words).filter((w) => w.typed.length).length}` },
    { label: t.stats.rains, value: `${state.rains.length}` },
  ];
  const cell = (ch: string) => {
    const owed = isOwed(state, ch);
    const met = known.has(ch);
    return (
      <li key={ch}>
        <button type="button" className={styles.letter} data-state={owed ? "owed" : met ? "met" : "new"} onClick={() => open(ch, { meet: false })} aria-label={ch}>
          {LETTER.has(ch) ? (
            <Letter ch={ch} size={34} color={owed ? "var(--again)" : met ? undefined : "var(--faint)"} />
          ) : (
            <span className={styles.way}>{ch === PATCHIM ? ja.letter.patchim.title : ja.letter.said.title}</span>
          )}
        </button>
      </li>
    );
  };

  return (
    <div className={page.page}>
      <header className={page.bar}>
        <h1 className={page.barTitle}>{t.title}</h1>
        <Link href="/app/me/settings" className={page.barButton}>
          {t.settings}
        </Link>
      </header>
      <p className={page.lead}>{t.lead}</p>

      <section className={page.section}>
        <dl className={styles.stats}>
          {stats.map((s) => (
            <div key={s.label}>
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={page.section}>
        <h2 className={page.h2}>{t.letters}</h2>
        <p className={page.note}>{t.lettersLead}</p>
        <p className={styles.groupTitle}>{t.first}</p>
        <ul className={styles.family}>{FIRST_LETTERS.map(cell)}</ul>
        <p className={styles.groupTitle}>{t.later}</p>
        <ul className={styles.family}>{MEET_ORDER.map(cell)}</ul>
      </section>

      <section className={page.section}>
        <h2 className={page.h2}>{t.days}</h2>
        {days.length ? (
          <ul className={styles.days}>
            {days.map(([d, e]) => (
              <li key={d}>
                <p className={styles.dayHead}>
                  {dayLabel(d, today)} <span>{t.dayRains(e.rains)}</span>
                </p>
                <dl className={styles.dayList}>
                  <div>
                    <dt>{t.dayWords}</dt>
                    <dd className="t-ko">{[...e.words].join("　")}</dd>
                  </div>
                  {e.met.size ? (
                    <div>
                      <dt>{t.dayMet}</dt>
                      <dd className={styles.metList}>
                        {[...e.met].map((x) =>
                          LETTER.has(x) ? (
                            <span key={x} className="t-ko">
                              {x}
                            </span>
                          ) : (
                            <span key={x}>{x === PATCHIM ? ja.letter.patchim.title : ja.letter.said.title}</span>
                          ),
                        )}
                      </dd>
                    </div>
                  ) : null}
                  {e.mixed.size ? (
                    <div>
                      <dt>{t.dayMixed}</dt>
                      <dd className="t-ko again">{[...e.mixed].join(" ")}</dd>
                    </div>
                  ) : null}
                </dl>
              </li>
            ))}
          </ul>
        ) : (
          <p className={page.empty}>{t.daysEmpty}</p>
        )}
      </section>

      <section className={page.section}>
        <h2 className={page.h2}>{t.lessons}</h2>
        <p className={page.note}>{ja.next.lead}</p>
        <ul className={page.rows}>
          <li>
            <Link href="/app/first" className={page.row}>
              <span className={page.rowMain}>
                <span className={page.rowTitle}>{ja.first.title}</span>
                <span className={page.rowSub}>{t.replay}</span>
              </span>
              {state.first ? <span className={page.met}>{ja.next.done}</span> : null}
              <Icon name="arrow" size={18} />
            </Link>
          </li>
          {LESSON_IDS.map((id, i) => (
            <li key={id}>
              <Link href={`/app/next/${id}`} className={page.row}>
                <span className={page.rowMain}>
                  <span className={page.rowTitle}>
                    {ja.next.number(i)}　{ja.next.lessons[id].name}
                  </span>
                  <span className={page.rowSub}>{ja.next.lessons[id].lead}</span>
                </span>
                {state.lessons?.[id] ? <span className={page.met}>{ja.next.done}</span> : null}
                <Icon name="arrow" size={18} />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={page.section}>
        <ul className={page.rows}>
          <li>
            <Link href="/app/me/export" className={page.row}>
              <span className={page.rowMain}>
                <span className={page.rowTitle}>{t.export}</span>
                <span className={page.rowSub}>{t.exportLead}</span>
              </span>
              <Icon name="arrow" size={18} />
            </Link>
          </li>
          <li>
            <Link href="/app/me/settings" className={page.row}>
              <span className={page.rowMain}>
                <span className={page.rowTitle}>{t.settings}</span>
              </span>
              <Icon name="arrow" size={18} />
            </Link>
          </li>
        </ul>
      </section>

      <section className={page.section}>
        <h2 className={page.h2}>{t.sister}</h2>
        <ul className={page.rows}>
          {t.sisters.map((s) => (
            <li key={s.name}>
              {s.name === ja.kotonoame.name ? (
                <a href={ja.kotonoame.url} className={page.row} target="_blank" rel="noopener">
                  <span className={page.rowMain}>
                    <span className={`wordmark-kana ${page.rowTitle}`}>{s.name}</span>
                    <span className={page.rowSub}>{s.lead}</span>
                  </span>
                  <Icon name="arrow" size={18} />
                </a>
              ) : (
                <div className={page.row} style={{ cursor: "default" }}>
                  <span className={page.rowMain}>
                    <span className={`wordmark-kana ${page.rowTitle}`}>{s.name}</span>
                    <span className={page.rowSub}>{s.lead}</span>
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
