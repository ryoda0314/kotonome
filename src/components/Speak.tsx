"use client";

import { Icon } from "./Icon";
import { say, stop, usePlaying } from "./sound";
import styles from "./Speak.module.css";

/** Says a Korean text; pressed again while it sounds, stops it. A ripple spreads while it plays (as in ことのあめ). */
export function Speak({
  text,
  label,
  id = text,
  size = "md",
  solid = false,
  turn,
}: {
  text: string;
  label: string;
  /** Names this button, when several say the same text. */
  id?: string;
  size?: "sm" | "md" | "lg";
  solid?: boolean;
  turn?: number;
}) {
  const playing = usePlaying() === id;
  return (
    <button
      type="button"
      className={[styles.button, styles[size], solid ? styles.solid : "", playing ? styles.playing : ""].join(" ")}
      onClick={() => (playing ? stop() : void say(text, { key: id, turn }))}
      aria-label={label}
      aria-pressed={playing}
    >
      <Icon name="speaker" size={size === "sm" ? 17 : size === "lg" ? 30 : 20} />
    </button>
  );
}
