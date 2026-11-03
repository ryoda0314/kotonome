"use client";

import { useEffect } from "react";
import { countUsage } from "./usage";

// Once a page load: the shell mounts again when the learner goes to the intro and back, and that is the same visit.
let counted = false;

/** The app opened: counted once a visit (usage.ts), not on going from page to page. */
export function CountOpen() {
  useEffect(() => {
    if (counted) return;
    counted = true;
    countUsage("open");
  }, []);
  return null;
}
