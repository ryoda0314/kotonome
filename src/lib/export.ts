// 学習の記録: the whole record as one Markdown text, for the learner to paste into an AI of their choice (the app
// itself calls no AI). Pure.

import { ALL_ITEMS, FIRST_LETTERS, LETTER, PATCHIM, SAID } from "./hangul.ts";
import { dayOf, isOwed, knownSet, type State } from "./record.ts";
import { LESSON_IDS, type LessonId } from "./lessons.ts";
import { readableWords } from "./rain-core.ts";

const LESSON_NAMES: Record<LessonId, string> = { breath: "息を強く・のどを締めて", vowels: "ヤ行・エ・ワ", patchim: "下にもう1字" };

const nameOf = (item: string) => (item === PATCHIM ? "パッチム" : item === SAID ? "発音（書いたとおりに読まない語）" : item);

export function exportMarkdown(s: State, prompt: string): string {
  const lines: string[] = [prompt, "", "# ことのめ の記録", ""];
  const known = knownSet(s);
  const met = ALL_ITEMS.filter((x) => known.has(x));
  lines.push(`- 90秒: ${s.first ? `${dayOf(s.first)} に見た` : "まだ"}`);
  for (const [i, id] of LESSON_IDS.entries()) {
    const at = s.lessons?.[id];
    lines.push(`- 次の90秒 ${i + 1}（${LESSON_NAMES[id]}）: ${at ? `${dayOf(at)} に済` : "まだ"}`);
  }
  lines.push(`- 出会った字: ${met.filter((x) => LETTER.has(x)).length} / 40（パッチム${known.has(PATCHIM) ? "も" : "はまだ"}）`);
  lines.push(`- 読める語: ${readableWords(s, known).length}`);
  lines.push(`- 読んだ語: ${Object.values(s.words).filter((w) => w.read.length).length}`);
  lines.push(`- 打った語: ${Object.values(s.words).filter((w) => w.typed.length).length}`);
  lines.push(`- 打った文: ${Object.keys(s.lines).length}`);
  lines.push(`- 雨（浴びる）: ${s.rains.length}`);

  lines.push("", "## 出会った順", "");
  const order = met
    .filter((x) => !FIRST_LETTERS.includes(x) && s.letters[x]?.met)
    .sort((a, b) => (s.letters[a].met ?? 0) - (s.letters[b].met ?? 0));
  if (!order.length) lines.push("- まだ（90秒の字だけ）");
  for (const x of order) lines.push(`- ${nameOf(x)}: ${dayOf(s.letters[x].met as number)}`);

  const mixed = Object.keys(s.letters)
    .filter((x) => s.letters[x].mixed.length)
    .sort((a, b) => s.letters[b].mixed.length - s.letters[a].mixed.length);
  lines.push("", "## 打ち間違えた字", "");
  if (!mixed.length) lines.push("- まだありません");
  for (const x of mixed) {
    const l = LETTER.get(x);
    lines.push(`- ${nameOf(x)}${l ? `（${l.anchor}）` : ""}: ${s.letters[x].mixed.length} 回${isOwed(s, x) ? "、まだまた降ってくる" : "、そのあと打てた"}`);
  }

  const byDay = new Map<string, { rains: number; words: Set<string>; met: Set<string>; mixed: Set<string> }>();
  for (const r of s.rains) {
    const d = dayOf(r.at);
    const e = byDay.get(d) ?? { rains: 0, words: new Set<string>(), met: new Set<string>(), mixed: new Set<string>() };
    e.rains++;
    r.words.forEach((w) => e.words.add(w));
    r.met.forEach((m) => e.met.add(nameOf(m)));
    r.mixed.forEach((m) => e.mixed.add(m));
    byDay.set(d, e);
  }
  lines.push("", "## 日ごと", "");
  if (!byDay.size) lines.push("- まだありません");
  for (const [d, e] of [...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0]))) {
    const parts = [`雨 ${e.rains}`, `浴びた語 ${[...e.words].join(" ")}`];
    if (e.met.size) parts.push(`はじめての字 ${[...e.met].join(" ")}`);
    if (e.mixed.size) parts.push(`打ち間違えた字 ${[...e.mixed].join(" ")}`);
    lines.push(`- ${d}: ${parts.join("、")}`);
  }
  return lines.join("\n") + "\n";
}
