import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ja } from "@/lib/i18n/ja";
import { LESSON, LESSON_IDS, type LessonId } from "@/lib/lessons";
import { Next } from "../../_lessons/Next";

export function generateStaticParams() {
  return LESSON_IDS.map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps<"/app/next/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: LESSON.has(id as LessonId) ? `${ja.next.lessons[id as LessonId].name}・${ja.next.title}` : ja.next.title };
}

export default async function NextPage({ params }: PageProps<"/app/next/[id]">) {
  const { id } = await params;
  if (!LESSON.has(id as LessonId)) notFound();
  return <Next id={id as LessonId} />;
}
