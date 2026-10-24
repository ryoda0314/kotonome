"use client";

// Korean said aloud: a text plays its clip (public/audio/<voice>/<id>.mp3, made ahead and checked by a recognizer,
// listed in src/content/audio.json), in one of two voices. A text without a clip is said by the device's Korean voice
// where it has one (speechSynthesis), else not at all. One sound at a time (player.ts); `usePlaying` tells a button
// it is the one sounding, for its ripple.

import { useSyncExternalStore } from "react";
import audio from "@/content/audio.json";
import { clipId } from "@/lib/hangul";
import { choiceNow, prefNow } from "./local";
import { play as playClip, preload as preloadClips, stop as stopClip } from "./player";

export const VOICE_IDS = ["kore", "charon"] as const;
export type VoiceChoice = "both" | "kore" | "charon";
export const VOICE_CHOICES: VoiceChoice[] = ["both", "kore", "charon"];

const have = (audio as { have: Record<string, string[]> }).have;

let playing: string | null = null;
const listeners = new Set<() => void>();
const set = (key: string | null) => {
  playing = key;
  listeners.forEach((l) => l());
};

/** The voice a text is said in: the learner's choice, or by turns; a voice the text has no clip in is passed over. */
function voiceFor(text: string, turn: number): string | null {
  const voices = have[clipId(text)] ?? [];
  if (!voices.length) return null;
  const choice = choiceNow("voice", "both") as VoiceChoice;
  if (choice !== "both" && voices.includes(choice)) return choice;
  return voices[Math.abs(turn) % voices.length];
}

export const urlFor = (text: string, turn = 0): string | null => {
  const v = voiceFor(text, turn);
  return v ? `/audio/${v}/${clipId(text)}.mp3` : null;
};

export const hasClip = (text: string) => (have[clipId(text)] ?? []).length > 0;

function speakWithDevice(text: string): Promise<boolean> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return Promise.resolve(false);
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find((v) => v.lang?.toLowerCase().startsWith("ko"));
  if (!voice) return Promise.resolve(false);
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = 0.9;
    u.onend = () => resolve(true);
    u.onerror = () => resolve(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  });
}

let turns = 0;
/**
 * Says a text. `key` names the button asking (several buttons may say the same text); `turn` picks the voice, so a
 * text heard again can come in the other voice. Resolves when it has ended or something newer took over.
 */
export async function say(text: string, { key = text, turn }: { key?: string; turn?: number } = {}): Promise<boolean> {
  if (!prefNow("sound", true)) return false;
  const url = urlFor(text, turn ?? turns++);
  set(key);
  const ok = url ? await playClip(url) : await speakWithDevice(text);
  if (playing === key) set(null);
  return ok;
}

export function stop(): void {
  stopClip();
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  set(null);
}

/** Fetches and decodes clips ahead, so they play the moment they are pressed. */
export function preload(texts: string[]): void {
  void preloadClips(texts.flatMap((t) => VOICE_IDS.flatMap((v) => (have[clipId(t)]?.includes(v) ? [`/audio/${v}/${clipId(t)}.mp3`] : []))));
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
export function usePlaying(): string | null {
  return useSyncExternalStore(subscribe, () => playing, () => null);
}
