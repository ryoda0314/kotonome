"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/Icon";
import { useChoice, usePref } from "@/components/local";
import page from "@/components/page.module.css";
import { VOICE_CHOICES, type VoiceChoice } from "@/components/sound";
import { ja } from "@/lib/i18n/ja";
import { useRecord } from "@/lib/store";
import { account, resetRecord, signOut, supabase, type Account } from "@/lib/sync";
import styles from "./settings.module.css";

const t = ja.settings;
const never = () => () => undefined;

/** 記録と設定: how to hear, how to type, the ことのあめ account, and clearing the record. */
export function Settings() {
  const state = useRecord();
  const [sound, setSound] = usePref("sound", true);
  const [narration, setNarration] = usePref("narration", true);
  const [voice, setVoice] = useChoice<VoiceChoice>("voice", VOICE_CHOICES, "both");
  const [guide, setGuide] = usePref("guide", true);
  const [me, setMe] = useState<Account | null | undefined>(undefined);
  const [done, setDone] = useState(false);
  const canLink = useSyncExternalStore(never, () => !!supabase(), () => false);
  useEffect(() => {
    void account().then(setMe);
  }, []);

  return (
    <div className={page.page}>
      <header className={page.bar}>
        <Link href="/app/me" className={page.iconLink} aria-label={ja.common.back}>
          <Icon name="back" size={22} />
        </Link>
        <h1 className={page.barTitle}>{t.title}</h1>
      </header>

      <section className={page.section}>
        <h2 className={page.h2}>{t.listen}</h2>
        <label className={styles.toggle}>
          <span>
            <span className={styles.toggleTitle}>{ja.common.sound}</span>
            <span className={page.note}>{t.soundLead}</span>
          </span>
          <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} />
        </label>
        <label className={styles.toggle}>
          <span>
            <span className={styles.toggleTitle}>{t.narration}</span>
            <span className={page.note}>{t.narrationLead}</span>
          </span>
          <input type="checkbox" checked={narration} onChange={(e) => setNarration(e.target.checked)} />
        </label>
        <div className={styles.toggle}>
          <span className={styles.toggleTitle}>{t.voice}</span>
          <span className={styles.choices} role="group" aria-label={t.voice}>
            {VOICE_CHOICES.map((v) => (
              <button key={v} type="button" className="btn-quiet" aria-pressed={voice === v} onClick={() => setVoice(v)}>
                {t.voices[v]}
              </button>
            ))}
          </span>
        </div>
      </section>

      <section className={page.section}>
        <h2 className={page.h2}>{t.typing}</h2>
        <label className={styles.toggle}>
          <span>
            <span className={styles.toggleTitle}>{t.guide}</span>
            <span className={page.note}>{t.guideLead}</span>
          </span>
          <input type="checkbox" checked={guide} onChange={(e) => setGuide(e.target.checked)} />
        </label>
      </section>

      <section className={page.section}>
        <h2 className={page.h2}>{t.account}</h2>
        {me ? (
          <>
            <p className={styles.text}>{t.linked(me.email ?? "")}</p>
            <p className={page.note}>{t.linkedLead}</p>
            <div className={page.actions}>
              <button
                type="button"
                className="btn-quiet"
                onClick={async () => {
                  await signOut();
                  setMe(null);
                }}
              >
                {t.unlink}
              </button>
            </div>
          </>
        ) : me === null && canLink ? (
          <>
            <p className={page.note}>{t.linkLead}</p>
            <div className={page.actions}>
              <Link href="/login?next=/app/me/settings" className="btn">
                {t.link}
              </Link>
            </div>
          </>
        ) : me === null ? (
          <p className={page.note}>{t.unavailable}</p>
        ) : null}
      </section>

      <section className={page.section}>
        <h2 className={page.h2}>{t.record}</h2>
        {state ? <p className={page.note}>{t.size(Object.keys(state.letters).length, Object.keys(state.words).length)}</p> : null}
        <div className={page.actions}>
          <button
            type="button"
            className="btn-quiet"
            onClick={async () => {
              if (!window.confirm(me ? t.resetLinkedConfirm : t.resetConfirm)) return;
              await resetRecord();
              setDone(true);
            }}
          >
            {me ? t.resetLinked : t.reset}
          </button>
        </div>
        {done ? <p className={page.note}>{t.done}</p> : null}
      </section>
    </div>
  );
}
