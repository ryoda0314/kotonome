import type { Metadata } from "next";
import { ja } from "@/lib/i18n/ja";
import { Start } from "./_rain/Start";

export const metadata: Metadata = { title: ja.rain.title };

export default function RainPage() {
  return <Start />;
}
