import { Icon, type IconName } from "@/components/Icon";
import styles from "./track.module.css";

export type RainStep = "read" | "notice" | "type" | "lines";
const ICONS: Record<RainStep, IconName> = { read: "rain", notice: "eye", type: "keys", lines: "lines" };

/**
 * Where the learner is in this rain: the steps on a track, those behind checked, this one lit, those ahead faint
 * (ことのおと's Steps). A guide, not a score: nothing is counted.
 */
export function Track({ steps, current, done = false }: { steps: { step: RainStep; label: string }[]; current: RainStep; done?: boolean }) {
  const at = done ? steps.length : steps.findIndex((s) => s.step === current);
  return (
    <ol className={styles.steps} aria-label="この雨の流れ" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
      {steps.map((s, i) => {
        const state = i < at ? "done" : i === at ? "now" : "next";
        return (
          <li key={s.step} className={styles.step} data-state={state} aria-current={state === "now" ? "step" : undefined}>
            <span className={styles.node} aria-hidden="true">
              <Icon name={state === "done" ? "check" : ICONS[s.step]} size={20} />
            </span>
            <span className={styles.label}>
              <span className={styles.number}>{i + 1}</span>
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
