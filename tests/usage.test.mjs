import assert from "node:assert/strict";
import { test } from "node:test";
import { countsHere, platformOf } from "../src/lib/usage-core.ts";

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

const UA = {
  iphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
  ipadOld: "Mozilla/5.0 (iPad; CPU OS 12_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1 Mobile/15E148 Safari/604.1",
  ipod: "Mozilla/5.0 (iPod touch; CPU iPhone OS 15_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
  mac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15",
  android: "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
  windows: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  chromebook: "Mozilla/5.0 (X11; CrOS x86_64 15917.71.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  linux: "Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0",
  ubuntu: "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0",
};

test("the kind of device: an iPhone, iPad or iPod is ios", () => {
  assert.equal(platformOf(UA.iphone, 5), "ios");
  assert.equal(platformOf(UA.ipadOld, 5), "ios");
  assert.equal(platformOf(UA.ipod, 5), "ios");
});

test("an iPad that says it is a Mac is ios by its touch; a Mac is pc", () => {
  assert.equal(platformOf(UA.mac, 5), "ios");
  assert.equal(platformOf(UA.mac, 0), "pc");
  assert.equal(platformOf(UA.mac, 1), "pc", "one touch point is not an iPad");
});

test("Android is android, though it says Linux too", () => {
  assert.equal(platformOf(UA.android, 5), "android");
  assert.equal(platformOf(UA.android, 0), "android");
});

test("Windows, a Chromebook and Linux are pc", () => {
  assert.equal(platformOf(UA.windows, 0), "pc");
  assert.equal(platformOf(UA.windows, 10), "pc", "a touch screen on Windows is still a pc");
  assert.equal(platformOf(UA.chromebook, 0), "pc");
  assert.equal(platformOf(UA.linux, 0), "pc");
  assert.equal(platformOf(UA.ubuntu, 0), "pc");
});

test("anything else, or nothing, is other", () => {
  assert.equal(platformOf("curl/8.5.0", 0), "other");
  assert.equal(platformOf("Mozilla/5.0 (PlayStation; PlayStation 5/2.26) AppleWebKit/605.1.15 (KHTML, like Gecko)", 0), "other");
  assert.equal(platformOf("", 0), "other");
  assert.equal(platformOf(undefined, 0), "other");
  assert.equal(platformOf(null, 5), "other");
  assert.equal(platformOf(42, 5), "other");
  assert.equal(platformOf(UA.mac, undefined), "pc", "no touch points known: a Mac");
  assert.equal(platformOf(UA.mac, Number.NaN), "pc");
});
