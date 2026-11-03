"use client";

// How many use ことのめ, for its maker (ことのあめ's admin): counted the same way in every sister, as ことのね's
// (its src/util/usage.ts). These go and nothing else: the app's name, this device's number (a random one made on this
// device, tied to no one and to no account), what happened (open: the app opened; learn: a rain gone through to its
// end; say: a word or sentence typed to its end), whether it was opened from the home screen, whether a ことのあめ
// account is signed in here (yes or no only, from the session on the device: sync.ts account()), and the kind of device
// (ios, android, pc or other: usage-core.ts platformOf). A plain request with the public key, never the app's Supabase
// client, so a signed-in learner's session does not go with it; never the account's id, a name, an email or what was
// typed. Counted only at the public address in a production build (usage-core.ts), and not once the learner switches
// it off in 記録と設定. A count that cannot be sent is let go without a word.
// ことのあめ keeps it: pl_app_ping in ../polylinga/supabase/migrations/20261103000000_app_usage.sql.
import { account } from "@/lib/sync";
import { countsHere, platformOf } from "@/lib/usage-core";
import { prefNow } from "./local";

export type UsageKind = "open" | "learn" | "say";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// The public address (kotonome.vercel.app is someone else's app).
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://kotonome-kappa.vercel.app";
/** This app's name at ことのあめ. */
const APP = "kotonome";
// Named for the language, as the record's key (store.ts).
const DEVICE = "hangul:device";
/** 記録と設定's 使われ方の数を送る: a preference of local.ts (kept as hangul:sendUsage, "0" once switched off). */
export const SEND_USAGE = "sendUsage";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** This device's number, made the first time; null when it cannot be kept (then nothing is counted). */
function deviceId(): string | null {
  try {
    let id = localStorage.getItem(DEVICE);
    if (!id || !UUID.test(id)) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** On unless the learner switched it off. */
export function sendsUsage(): boolean {
  return prefNow(SEND_USAGE, true);
}

function standalone(): boolean {
  return window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/** One more of this kind (not waited for). */
export function countUsage(kind: UsageKind): void {
  if (typeof window === "undefined" || !URL_ || !KEY) return;
  try {
    if (!countsHere(location.origin, SITE, process.env.NODE_ENV === "production") || !sendsUsage()) return;
    const device = deviceId();
    if (!device) return;
    const body = {
      p_app: APP,
      p_device: device,
      p_kind: kind,
      p_standalone: standalone(),
      p_platform: platformOf(navigator.userAgent, navigator.maxTouchPoints ?? 0),
    };
    // Signed in or not, from the session kept on this device: only that yes or no goes, nothing of the account.
    account()
      .then(
        (a) => !!a,
        () => false,
      )
      .then((signedIn) =>
        fetch(`${URL_}/rest/v1/rpc/pl_app_ping`, {
          method: "POST",
          headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, p_signed_in: signedIn }),
          keepalive: true,
        }),
      )
      .catch(() => {
        // Not counted this time.
      });
  } catch {
    // Not counted this time.
  }
}
