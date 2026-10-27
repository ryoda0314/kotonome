import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Letter, Word } from "@/components/Glyph";
import { ja } from "@/lib/i18n/ja";
import { WORD } from "@/content/words";
import styles from "./page.module.css";

const t = ja.intro;

/** The first screen, static: how it goes (16 letters, then the rain, letters met there, the keyboard) and the way in. */
export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Logo size="lg" href={null} />
      </header>
      <section className={styles.hero}>
        <h1 className={styles.lead}>{t.lead}</h1>
        <figure className={styles.figure} aria-label="ㄱ ㄴ ㅁ ㅅ ㅇ">
          <div className={styles.five}>
            {["ㄱ", "ㄴ", "ㅁ", "ㅅ", "ㅇ"].map((ch, i) => (
              <span key={ch} className={styles.cell}>
                <Letter ch={ch} size={52} draw />
                <span className={styles.where}>{t.places[i]}</span>
              </span>
            ))}
          </div>
        </figure>
        {t.body.map((p) => (
          <p key={p} className={styles.body}>
            {p}
          </p>
        ))}
        <div className={styles.words}>
          {t.sample.map((ko) => (
            <span key={ko} className={styles.word}>
              <Word text={ko} height={40} />
              <span className={styles.meaning}>{WORD.get(ko)?.ja}</span>
            </span>
          ))}
          <span className={styles.wordsNote}>{t.sampleNote}</span>
        </div>
        <Link href="/app" className={`btn ${styles.start}`}>
          {t.start}
        </Link>
        <p className={styles.note}>{t.note}</p>
        {/* Only when this app can reach ことのあめ's accounts (README: Linking ことのあめ accounts). */}
        {process.env.NEXT_PUBLIC_SUPABASE_URL ? (
          <Link href="/login?next=/app" className={styles.link}>
            {t.link}
          </Link>
        ) : null}
      </section>
    </div>
  );
}
