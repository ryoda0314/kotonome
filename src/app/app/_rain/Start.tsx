"use client";

// 浴びる, or before the first rain the 90 seconds (once; passing them over counts as having seen them).

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
