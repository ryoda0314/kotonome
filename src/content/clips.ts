// Every text that has a clip: the words, and the syllables a letter is heard in on its own (each consonant with ㅏ,
// each vowel after the silent ㅇ: hangul.ts soundOf). scripts/generate-audio.mjs voices these; src/content/audio.json
// lists what passed.
import { WORDS } from "./words.ts";

const CONSONANT_A = [..."가나다라마바사아자차카타파하까따빠싸짜"];
const VOWEL_O = [..."아어오우으이야여요유애에얘예와왜외워웨위의"];

/** The syllables letters are heard in on their own. */
export const DEMO_SYLLABLES = [...new Set([...CONSONANT_A, ...VOWEL_O])];

export const CLIP_TEXTS = [...new Set([...WORDS.map((w) => w.ko), ...DEMO_SYLLABLES])];

export const VOICES = [
  { id: "kore", name: "Kore", sex: "f" },
  { id: "charon", name: "Charon", sex: "m" },
] as const;
export type VoiceId = (typeof VOICES)[number]["id"];
