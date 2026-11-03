// Where the usage count (components/usage.ts) is kept: only a production build opened at the public address, never
// `npm run dev`, `npm start` on this computer or a Vercel preview; and the kind of device it tells. Pure; tested in
// tests/usage.test.mjs.

/** True only in production and when `origin` is the public address's (`site`'s) origin; false on anything malformed. */
export function countsHere(origin: string, site: string, production: boolean): boolean {
  if (production !== true || typeof origin !== "string" || typeof site !== "string" || !origin) return false;
  try {
    return origin === new URL(site).origin;
  } catch {
    return false;
  }
}

export type Platform = "ios" | "android" | "pc" | "other";

/**
 * The kind of device, from the browser's user agent: only one of these four words goes with a count. An iPad says it is
 * a Mac (Macintosh) but can be touched; Android says Linux too, so it is asked first.
 */
export function platformOf(userAgent: string, maxTouchPoints: number): Platform {
  if (typeof userAgent !== "string" || !userAgent) return "other";
  const touch = typeof maxTouchPoints === "number" && maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(userAgent)) return "ios";
  if (/Macintosh/.test(userAgent) && touch) return "ios";
  if (/Android/.test(userAgent)) return "android";
  if (/Windows|Macintosh|CrOS|X11|Linux/.test(userAgent)) return "pc";
  return "other";
}
