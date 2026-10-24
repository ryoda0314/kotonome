import type { Metadata } from "next";
import { ja } from "@/lib/i18n/ja";
import { LinesRound } from "../_type/LinesRound";

export const metadata: Metadata = { title: `${ja.type.lines}・${ja.type.title}` };

export default function Page() {
  return <LinesRound />;
}
