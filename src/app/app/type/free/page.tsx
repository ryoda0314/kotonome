import type { Metadata } from "next";
import { ja } from "@/lib/i18n/ja";
import { Free } from "../_type/Free";

export const metadata: Metadata = { title: `${ja.type.free}・${ja.type.title}` };

export default function Page() {
  return <Free />;
}
