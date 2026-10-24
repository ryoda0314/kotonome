import type { Metadata } from "next";
import { ja } from "@/lib/i18n/ja";
import { Again } from "./Again";

export const metadata: Metadata = { title: ja.first.title };

export default function FirstPage() {
  return <Again />;
}
