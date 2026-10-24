"use client";

// 打って聞く: type anything and hear it, as the author typed what they found or made into a translator only to hear how
// the spelling sounds. A word of ことのめ or a sentence of ことのあめ is said in its own clip; anything else by the
// device's Korean voice, where it has one (no AI is called). A letter not met yet in what was typed is dotted and opens
// there and then.

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { Keyboard } from "@/components/Keyboard";
import { KoText } from "@/components/KoText";
import { prefNow } from "@/components/local";
import page from "@/components/page.module.css";
import { play } from "@/components/player";
import { say, stop, usePlaying } from "@/components/sound";
import SENTENCES from "@/content/sentences.json";
import { back, emptyKb, normalize, press, textOf, type Kb } from "@/lib/dubeol";
import { ja } from "@/lib/i18n/ja";
import { knownSet } from "@/lib/record";
import type { Sentence } from "@/lib/sentences";
import { useRecord } from "@/lib/store";
import styles from "./type.module.css";

const t = ja.type;

export function Free() {
  const state = useRecord();
  const [kb, setKb] = useState<Kb>(emptyKb);
  const [silent, setSilent] = useState(false);
  const [clip, setClip] = useState(false);
  const playing = usePlaying();
  const known = useMemo(() => (state ? knownSet(state) : new Set<string>()), [state]);
  const text = textOf(kb);

  const hear = async () => {
    const said = normalize(text);
    if (!said) return;
    setSilent(false);
    const line = (SENTENCES as Sentence[]).find((s) => normalize(s.ko) === said);
    if (line) {
      stop();
      setClip(true);
      await play(line.audio);
      setClip(false);
      return;
    }
    const ok = await say(said, { key: "free" });
    if (!ok && prefNow("sound", true)) setSilent(true);
  };

  return (
    <div className={page.page}>
      <header className={page.bar}>
        <Link href="/app/type" className={page.iconLink} aria-label={ja.common.back}>
          <Icon name="back" size={22} />
        </Link>
        <h1 className={page.barTitle}>{t.free}</h1>
      </header>
      <p className={page.lead}>{t.freeLead}</p>
      <div className={styles.pad}>
        <div className={styles.padText} aria-live="polite">
          {text ? <KoText text={text} known={known} /> : <span className={styles.padPlaceholder}>{ja.typing.placeholder}</span>}
          <span className={styles.caret} aria-hidden="true" />
        </div>
        <div className={styles.padActions}>
          <button
            type="button"
            className="btn"
            disabled={!normalize(text)}
            data-playing={clip || playing === "free" ? "" : undefined}
            onClick={() => void hear()}
          >
            <Icon name="speaker" size={18} />
            {t.hear}
          </button>
          <button type="button" className="btn-quiet" disabled={!text} onClick={() => setKb(emptyKb())}>
            {t.clear}
          </button>
        </div>
        <p className={styles.padNote}>{silent ? t.noVoice : t.freeNote}</p>
        <Keyboard onKey={(k) => setKb(press(kb, k))} onBack={() => setKb(back(kb))} onEnter={() => void hear()} />
      </div>
    </div>
  );
}
