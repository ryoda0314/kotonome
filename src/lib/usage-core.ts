// Where the usage count (components/usage.ts) is kept: only a production build opened at the public address, never
// `npm run dev`, `npm start` on this computer or a Vercel preview. Pure; tested in tests/usage.test.mjs.

/** True only in production and when `origin` is the public address's (`site`'s) origin; false on anything malformed. */
export function countsHere(origin: string, site: string, production: boolean): boolean {
  if (production !== true || typeof origin !== "string" || typeof site !== "string" || !origin) return false;
  try {
    return origin === new URL(site).origin;
  } catch {
    return false;
  }
}
