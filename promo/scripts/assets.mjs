// 映像に要るものを public/ に集める。
//   - アプリのアイコン（../public/icons/icon-512.png）
//   - アプリの韓国語の声（../public/audio/kore/<clip id>.mp3）：映像に出てくる語と音節だけ。名前はアプリと同じ clipId。
//     ナレーションと同じくらいの大きさに上げて WAV に
//   - ことのあめ の例文の声（../src/content/sentences.json の audio：ことのあめ の公開の置き場から）
//   - アプリの字（IBM Plex Sans JP・IBM Plex Sans KR・しっぽり明朝）。Google Fonts の倉庫（OFL）からまるごと取り、
//     映像の元（src/）と、映像が読み込むアプリの部品（../src/lib の hangul.ts・dubeol.ts）に出てくる字だけに切る
//     （Python の fontTools）。言葉を変えたら、もう一度走らせる。
//   node scripts/assets.mjs        (npm run assets)
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { clipId } from "../../src/lib/hangul.ts";

const APP = "..";
/** 映像で鳴らすアプリの声（src/timeline.ts の CLIPS と同じ）。 */
const WORDS = ["가", "나", "아", "카", "라디오", "카드", "코코아", "키"];
const LINE = "여기 카드 되는구나.";
const FONTS = {
  "IBMPlexSansJP-Regular.ttf": "ibmplexsansjp/IBMPlexSansJP-Regular.ttf",
  "IBMPlexSansJP-Medium.ttf": "ibmplexsansjp/IBMPlexSansJP-Medium.ttf",
  "IBMPlexSansJP-SemiBold.ttf": "ibmplexsansjp/IBMPlexSansJP-SemiBold.ttf",
  "IBMPlexSansKR-Regular.ttf": "ibmplexsanskr/IBMPlexSansKR-Regular.ttf",
  "IBMPlexSansKR-Medium.ttf": "ibmplexsanskr/IBMPlexSansKR-Medium.ttf",
  "IBMPlexSansKR-SemiBold.ttf": "ibmplexsanskr/IBMPlexSansKR-SemiBold.ttf",
  "ShipporiMincho-Bold.ttf": "shipporimincho/ShipporiMincho-Bold.ttf",
};
const WHOLE = "node_modules/.cache/fonts";

for (const d of ["public/app/clips", "public/fonts", WHOLE]) mkdirSync(d, { recursive: true });
copyFileSync(`${APP}/public/icons/icon-512.png`, "public/app/icon.png");

/**
 * 声の大きさをナレーション（およそ -16 LUFS）にそろえる：アプリの声はおよそ -20、例文の声はおよそ -19 なので、決まった
 * だけ上げる（Remotion の ffmpeg の volume。測ったのは ebur128：README の「音」）。
 */
function lift(from, to, db) {
  const r = spawnSync("npx", ["remotion", "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", from, "-af", `volume=${db}dB`, to], { encoding: "utf8", shell: true });
  if (r.status !== 0) throw new Error(`${from}: ${r.stderr}`);
}
const CLIP_LIFT = 4;
const LINE_LIFT = 3;

for (const w of WORDS) {
  const from = `${APP}/public/audio/kore/${clipId(w)}.mp3`;
  if (!existsSync(from)) throw new Error(`アプリに ${w} の声が無い（${from}）`);
  lift(from, `public/app/clips/${clipId(w)}.wav`, CLIP_LIFT);
}
const sentence = JSON.parse(readFileSync(`${APP}/src/content/sentences.json`, "utf8")).find((s) => s.ko === LINE);
if (!sentence) throw new Error(`例文が無い：${LINE}`);
const raw = `${WHOLE}/../line-raw.wav`;
if (!existsSync(raw)) {
  const res = await fetch(sentence.audio);
  if (!res.ok) throw new Error(`例文の声：${res.status}`);
  writeFileSync(raw, Buffer.from(await res.arrayBuffer()));
}
lift(raw, "public/app/line.wav", LINE_LIFT);
// 例文の声の長さ（映像の時はこの長さから：src/timeline.ts）。WAV のかたまりを順に見て data を探す。
const wav = readFileSync("public/app/line.wav");
let at = 12;
let rate = 0;
let bytesPerSecond = 0;
let seconds = 0;
while (at + 8 <= wav.length) {
  const id = wav.toString("ascii", at, at + 4);
  const size = wav.readUInt32LE(at + 4);
  if (id === "fmt ") {
    rate = wav.readUInt32LE(at + 12);
    bytesPerSecond = wav.readUInt32LE(at + 16);
  }
  if (id === "data") {
    seconds = size / bytesPerSecond;
    break;
  }
  at += 8 + size + (size % 2);
}
if (!seconds) throw new Error("例文の声の長さが読めない");
writeFileSync("src/clips.json", `${JSON.stringify({ line: Math.round(seconds * 1000) / 1000, rate }, null, 1)}
`);
console.log(`  clips ${WORDS.length}、例文の声 1（${seconds.toFixed(2)}秒）`);

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
}
console.log(`  fonts cut to ${chars.size} characters`);
