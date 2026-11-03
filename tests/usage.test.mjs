import assert from "node:assert/strict";
import { test } from "node:test";
import { countsHere } from "../src/lib/usage-core.ts";

const SITE = "https://kotonome-kappa.vercel.app";

test("counted only in production at the public address", () => {
  assert.equal(countsHere(SITE, SITE, true), true);
  assert.equal(countsHere(SITE, `${SITE}/`, true), true, "a trailing slash on the address is the same origin");
  assert.equal(countsHere(SITE, `${SITE}/app`, true), true);
  assert.equal(countsHere(SITE, SITE, false), false, "not in development");
});

test("not on this computer, a preview, or another site", () => {
  assert.equal(countsHere("http://localhost:3230", SITE, true), false);
  assert.equal(countsHere("https://kotonome-git-main-someone.vercel.app", SITE, true), false);
  assert.equal(countsHere("https://kotonome.vercel.app", SITE, true), false);
  assert.equal(countsHere("http://kotonome-kappa.vercel.app", SITE, true), false, "another scheme is another origin");
});

test("nothing malformed counts", () => {
  assert.equal(countsHere(SITE, "kotonome-kappa.vercel.app", true), false, "an address without its scheme");
  assert.equal(countsHere(SITE, "", true), false);
  assert.equal(countsHere("", SITE, true), false);
  assert.equal(countsHere("null", SITE, true), false);
  assert.equal(countsHere(undefined, SITE, true), false);
  assert.equal(countsHere(SITE, undefined, true), false);
  assert.equal(countsHere(SITE, SITE, "production"), false);
});
