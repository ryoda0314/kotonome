// ことのあめ's Korean sentences (src/content/sentences.json, from scripts/export-sentences.mjs) and where a word stands
// in one. Pure: the script that chooses the sentences and the rain that shows them (rain-core pickLines) use the same
// test.

/** After a word in a sentence: nothing, or a particle or a copula ending (가게에서, 커피랑, 친구예요). */
const TAILS = new Set([
  "", "은", "는", "이", "가", "을", "를", "에", "에서", "에게", "한테", "도", "랑", "이랑", "하고", "의", "로", "으로", "만",
  "까지", "부터", "보다", "처럼", "야", "이야", "예요", "이에요", "요", "에요", "는요", "도요", "이지", "지", "인데", "네", "께",
]);
/** One-syllable words that are mostly something else in running text (해 "do", 나 "come out", 다 "all", 김에 "while"): not looked for. */
const AMBIGUOUS = new Set([
  ..."해나다더저그이게네예일위왜뭐또너구삼오사만천백십칠육원개배새말살발반상간감강산기귀차피비코키무소씨표달불풀굴공방밤박곧물김약얘",
]);
const PUNCT = /[.,!?~…'"]/g;

/** The index of the space-separated piece where `word` stands, or -1 (a bare prefix would find 간 in 간단히). */
export function pieceOf(sentence: string, word: string): number {
  if ([...word].length === 1 && AMBIGUOUS.has(word)) return -1;
  return sentence.split(/\s+/).findIndex((raw) => {
    const piece = raw.replace(PUNCT, "");
    return piece.startsWith(word) && TAILS.has(piece.slice(word.length));
  });
}

export const holds = (sentence: string, word: string) => pieceOf(sentence, word) >= 0;

export type Sentence = { ko: string; ja: string; audio: string; words: string[] };
