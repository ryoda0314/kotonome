// 映像の音の区切り（秒）を JSON で書き出す。scripts/music.py に渡す。
//   node scripts/marks.mjs | python scripts/music.py public/sound        (npm run music：src/timeline.ts の MUSIC_MARKS)
//   node scripts/marks.mjs install | python scripts/music.py public/sound --music install-music.wav
//                                                    (npm run install-music：src/install-timeline.ts の INSTALL_MARKS)
import { build } from "esbuild";
import { mkdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const install = process.argv[2] === "install";
const entry = install ? "src/install-timeline.ts" : "src/timeline.ts";
const out = await build({ entryPoints: [entry], bundle: true, format: "esm", platform: "node", external: ["remotion"], write: false });
mkdirSync("node_modules/.cache", { recursive: true });
const file = `node_modules/.cache/${install ? "install-timeline" : "timeline"}.mjs`;
writeFileSync(file, out.outputFiles[0].text);
const marks = await import(pathToFileURL(file).href);
process.stdout.write(JSON.stringify(install ? marks.INSTALL_MARKS : marks.MUSIC_MARKS));
