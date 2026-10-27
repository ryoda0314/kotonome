"use client";

// 浴びる, or before the first rain 最初の16字 (once; passing it over counts as having seen it).

import page from "@/components/page.module.css";
import { ja } from "@/lib/i18n/ja";
import { seeFirst } from "@/lib/record";
import { commit, useRecord } from "@/lib/store";
import { First } from "../_lessons/First";
import { Rain } from "./Rain";

export function Start() {
  const state = useRecord();
  if (!state) {
    return (
      <div className={page.page}>
        <p className={page.skeleton}>{ja.common.loading}</p>
      </div>
    );
  }
  if (!state.first) return <First onFinish={() => commit((s) => seeFirst(s, Date.now()))} />;
  return <Rain />;
}
