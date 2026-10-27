"use client";

// 次の字: one of the lessons of src/lib/lessons.ts, page by page, in the way of 最初の16字. At the end its letters (or
// パッチム) are met and the learner goes back to the rain, which now passes them over.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import page from "@/components/page.module.css";
import { FIRST_LETTERS } from "@/lib/hangul";
import { ja } from "@/lib/i18n/ja";
import { LESSON, LESSON_IDS, type LessonId, type LessonStep } from "@/lib/lessons";
import { letterPractice, wordPractice } from "@/lib/practice";
import { knownSet, seeLesson } from "@/lib/record";
import { commit, useRecord } from "@/lib/store";
import { Lesson, type LessonPage } from "./Lesson";
import { ComparePage, EndPage, GrowPage, JoinPage, ReadPage, Recall, ShowPage } from "./pages";

const n = ja.next;

function pageOf(id: LessonId, step: LessonStep, items: string[], known: ReadonlySet<string>): LessonPage {
  const c = n.lessons[id];
  const key = `${step.kind}-${step.key}`;
  switch (step.kind) {
    case "grow": {
      const g = (c as typeof n.lessons.breath).grow[step.key];
      return { key, render: () => <GrowPage chs={step.chs} kicker={g.kicker} say={g.say} how={g.how} /> };
    }
    case "practice":
      return { key, render: () => <Recall items={letterPractice(step.letters, step.times)} lead={n.practiceLead} done={n.practiceDone} /> };
    case "words": {
      const w = n.lessons.patchim.words[step.key];
      return { key, render: () => <Recall items={wordPractice(step.groups, step.times)} lead={w.lead} wordHint={w.hint} done={n.practiceDone} /> };
    }
    case "compare":
      return { key, render: () => <ComparePage title={n.lessons.breath.compare.title} lead={n.lessons.breath.compare.lead} groups={step.groups} /> };
    case "show": {
      const s = n.lessons.patchim.show[step.key];
      return { key, render: () => <ShowPage title={s.title} body={s.body} mouths={step.mouths} words={step.words} /> };
    }
    case "join":
      return { key, render: () => <JoinPage syls={step.syls} title={n.lessons.patchim.join.title} lead={n.lessons.patchim.join.lead} /> };
    case "read":
      return { key, render: () => <ReadPage words={step.words} title={n.readTitle} lead={n.readLead} known={known} /> };
    case "end":
      return { key, render: () => <EndPage title={c.end.title} body={c.end.body} letters={items} /> };
  }
}

export function Next({ id }: { id: LessonId }) {
  const state = useRecord();
  const router = useRouter();
  const lesson = LESSON.get(id);
  if (!lesson) return null;
  // What is known while reading at the end: everything met, and this lesson's letters.
  const known = new Set([...(state ? knownSet(state) : FIRST_LETTERS), ...lesson.items]);
  const pages = lesson.steps.map((step) => pageOf(id, step, lesson.items, known));
  return (
    <Lesson
      title={
        <>
          <span className={page.barSub}>{n.number(LESSON_IDS.indexOf(id))}</span>
          {n.lessons[id].name}
        </>
      }
      pages={pages}
      finish={n.finish}
      onFinish={() => {
        commit((s) => seeLesson(s, id, lesson.items, Date.now()));
        router.push("/app");
      }}
      aside={
        <Link href="/app" className={page.iconLink} aria-label={n.back}>
          <Icon name="close" size={20} />
        </Link>
      }
    />
  );
}
