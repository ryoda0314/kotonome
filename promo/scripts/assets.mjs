// 映像に要るものを public/ に集める。
//   - アプリのアイコン（../public/icons/icon-512.png）
//   - アプリの韓国語の声（../public/audio/kore/<clip id>.mp3）：映像に出てくる語と音節だけ。名前はアプリと同じ clipId。
//     ナレーションと同じくらいの大きさに上げて WAV に
//   - アプリの字（IBM Plex Sans JP・IBM Plex Sans KR・しっぽり明朝）と、引用の明朝（Noto Serif SC：『訓民正音』の 㑹
//     があるもの。太さ 700 の一つに固める）。Google Fonts の倉庫（OFL）からまるごと取り、映像の元（src/）と、映像が
//     読み込むアプリの部品（../src/lib の hangul.ts・dubeol.ts）に出てくる字だけに切る（Python の fontTools）。言葉を
//     変えたら、もう一度走らせる。
//   node scripts/assets.mjs        (npm run assets)
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { clipId } from "../../src/lib/hangul.ts";

const APP = "..";
/** 映像で鳴らすアプリの声（src/timeline.ts で play するもの）。 */
const WORDS = ["가", "나", "다", "마", "아", "어", "오", "우", "으", "이", "나무", "라디오", "바나나", "드라마", "카", "카드"];
const FONTS = {
  "IBMPlexSansJP-Regular.ttf": "ibmplexsansjp/IBMPlexSansJP-Regular.ttf",
  "IBMPlexSansJP-Medium.ttf": "ibmplexsansjp/IBMPlexSansJP-Medium.ttf",
  "IBMPlexSansJP-SemiBold.ttf": "ibmplexsansjp/IBMPlexSansJP-SemiBold.ttf",
  "IBMPlexSansKR-Regular.ttf": "ibmplexsanskr/IBMPlexSansKR-Regular.ttf",
  "IBMPlexSansKR-Medium.ttf": "ibmplexsanskr/IBMPlexSansKR-Medium.ttf",
  "IBMPlexSansKR-SemiBold.ttf": "ibmplexsanskr/IBMPlexSansKR-SemiBold.ttf",
  "ShipporiMincho-Bold.ttf": "shipporimincho/ShipporiMincho-Bold.ttf",
  "NotoSerifSC-Bold.ttf": "notoserifsc/NotoSerifSC%5Bwght%5D.ttf",
};
/** 太さの軸のある字は、一つの太さに固める（映像で使うのは一つだけ）。 */
const INSTANCE = { "NotoSerifSC-Bold.ttf": "wght=700" };
const WHOLE = "node_modules/.cache/fonts";

for (const d of ["public/app/clips", "public/fonts", WHOLE]) mkdirSync(d, { recursive: true });
copyFileSync(`${APP}/public/icons/icon-512.png`, "public/app/icon.png");

/**
 * 声の大きさをナレーション（およそ -16 LUFS）にそろえる：アプリの声はおよそ -20 なので、決まっただけ上げる（Remotion の
 * ffmpeg の volume。測ったのは ebur128：README の「音」）。
 */
function lift(from, to, db) {
  const r = spawnSync("npx", ["remotion", "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", from, "-af", `volume=${db}dB`, to], { encoding: "utf8", shell: true });
  if (r.status !== 0) throw new Error(`${from}: ${r.stderr}`);
}
const CLIP_LIFT = 4;

for (const w of WORDS) {
  const from = `${APP}/public/audio/kore/${clipId(w)}.mp3`;
  if (!existsSync(from)) throw new Error(`アプリに ${w} の声が無い（${from}）`);
  lift(from, `public/app/clips/${clipId(w)}.wav`, CLIP_LIFT);
}
// 映像で鳴らさなくなった語の声は消す。
const keep = new Set(WORDS.map((w) => `${clipId(w)}.wav`));
for (const name of readdirSync("public/app/clips")) if (!keep.has(name)) rmSync(`public/app/clips/${name}`);
console.log(`  clips ${WORDS.length}`);

// 映像の元と、読み込むアプリの部品に出てくる字（と、印字できる ASCII すべて）。
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
const chars = new Set(Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)));
for (const file of [...walk("src"), `${APP}/src/lib/hangul.ts`, `${APP}/src/lib/dubeol.ts`]) for (const ch of readFileSync(file, "utf8")) if (ch > "\u007f") chars.add(ch);
writeFileSync(`${WHOLE}/chars.txt`, [...chars].join(""));

for (const [file, path] of Object.entries(FONTS)) {
  if (!existsSync(`${WHOLE}/${file}`)) {
    const res = await fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/${path}`);
    if (!res.ok) throw new Error(`${file}: ${res.status}`);
    writeFileSync(`${WHOLE}/${file}`, Buffer.from(await res.arrayBuffer()));
    console.log(`  font ${file}`);
  }
  const cut = spawnSync(
    "python",
    ["-m", "fontTools.subset", `${WHOLE}/${file}`, `--text-file=${WHOLE}/chars.txt`, `--output-file=public/fonts/${file}`, "--layout-features=*", "--no-hinting"],
    { encoding: "utf8" },
  );
  if (cut.status !== 0) throw new Error(`cutting ${file} (pip install fonttools): ${cut.stderr}`);
  if (INSTANCE[file]) {
    const one = spawnSync("python", ["-m", "fontTools.varLib.instancer", `public/fonts/${file}`, INSTANCE[file], "-o", `public/fonts/${file}`], { encoding: "utf8" });
    if (one.status !== 0) throw new Error(`instancing ${file}: ${one.stderr}`);
  }
}
console.log(`  fonts cut to ${chars.size} characters`);
