// Words one letter apart, to hear side by side when a letter is met (気づく → 聞き比べる): the word with the new letter
// and the words with the letter it is easily taken for, as the author once heard 딸기 and 달기 for an hour until they
// came apart. Nothing is asked; the learner listens as often as they like. Every word is in words.ts.

import { lettersOf, PATCHIM } from "../lib/hangul.ts";

export const PAIRS: string[][] = [
  // 息の強さ: ふつう・強い・詰まる
  ["달", "탈", "딸"],
  ["불", "풀", "뿔"],
  ["자다", "차다", "짜다"],
  ["공", "콩"],
  ["굴", "꿀"],
  ["방", "빵"],
  ["발", "팔"],
  ["비", "피"],
  ["사다", "싸다"],
  ["살", "쌀"],
  // オが2つ、ウが2つ
  ["커피", "코피"],
  ["거기", "고기"],
  ["서리", "소리"],
  ["거리", "고리"],
  ["구", "그"],
  ["구분", "그분"],
  // 下の字（パッチム）
  ["산", "삼", "상"],
  ["간", "감", "강"],
  ["반", "밤", "방"],
  ["박", "밭", "밥"],
  // 重なる母音
  ["과자", "가자"],
  ["귀", "기"],
  ["의사", "이사"],
];

/** The letters that tell two words apart, place for place (달/딸 → ㄷ). */
export function lettersApart(a: string, b: string): string[] {
  const key = (l: { role: string; at: number }) => `${l.at}:${l.role}`;
  const other = new Map(lettersOf(b).map((l) => [key(l), l.ch]));
  return [...new Set(lettersOf(a).filter((l) => other.get(key(l)) !== l.ch).map((l) => l.ch))];
}

/** Do two words differ under the vowel (산/상)? */
const apartBelow = (a: string, b: string) => {
  const below = (w: string) => lettersOf(w).filter((l) => l.role === "jong").map((l) => `${l.at}:${l.ch}`).join();
  return below(a) !== below(b);
};

/**
 * The groups that tell `item` apart from what it is taken for (for パッチム: the groups told apart by the letter under
 * the vowel), with only the words `show` allows; groups left with one word are dropped.
 */
export function pairsFor(item: string, show: (ko: string) => boolean): string[][] {
  return PAIRS.filter((p) =>
    p.some((a, i) => p.some((b, j) => i !== j && (item === PATCHIM ? apartBelow(a, b) : lettersApart(a, b).includes(item)))),
  )
    .map((p) => p.filter(show))
    .filter((p) => p.length > 1 && (item === PATCHIM || p.some((w) => lettersOf(w).some((l) => l.ch === item))));
}
