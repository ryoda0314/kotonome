"use client";

// The 90 seconds again, from 自分: at the end, back to the rain.

import { useRouter } from "next/navigation";
import { seeFirst } from "@/lib/record";
import { commit } from "@/lib/store";
import { First } from "../_lessons/First";

export function Again() {
  const router = useRouter();
  return (
    <First
      onFinish={() => {
        commit((s) => seeFirst(s, Date.now()));
        router.push("/app");
      }}
    />
  );
}
