// 目視確認用の静止画をまとめて出す（1回のバンドルで複数フレーム）。
//   node bin/stills.mjs                 各セリフの終わり直前（アニメーションが出そろった瞬間）
//   node bin/stills.mjs cg2:0.5 w3a:1   セリフID:割合（0=頭, 1=終わり）を指定
//   node bin/stills.mjs 1234 2000       フレーム番号を直接指定
// 出力: out/stills/*.png と、4枚ずつ並べた out/stills/sheet-XX.png
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'out', 'stills');
const tl = JSON.parse(readFileSync(join(ROOT, 'src', 'generated', 'timeline.json'), 'utf8'));
const FPS = tl.fps;

const args = process.argv.slice(2);
const targets = [];
if (!args.length) {
  for (const l of tl.lines) targets.push({ name: l.id, frame: Math.round((l.start + l.duration) * FPS) - 4 });
  targets.push({ name: 'last', frame: tl.durationInFrames - 1 });
} else {
  for (const a of args) {
    if (/^\d+$/.test(a)) targets.push({ name: `f${a}`, frame: +a });
    else {
      const [id, frac = '1'] = a.split(':');
      const l = tl.lines.find((x) => x.id === id);
      if (!l) throw new Error(`セリフIDが無い: ${id}`);
      targets.push({ name: `${id}-${frac}`, frame: Math.round((l.start + l.duration * +frac) * FPS) - (+frac >= 1 ? 4 : 0) });
    }
  }
}

const sheetsOnly = process.argv.includes('--sheets-only');
if (!sheetsOnly) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const serveUrl = await bundle({ entryPoint: join(ROOT, 'src', 'index.js'), webpackOverride: (c) => ({
  ...c,
  module: { ...c.module, rules: [...(c.module?.rules ?? []), { test: /\.m?jsx?$/, resolve: { fullySpecified: false } }] },
}) });
const composition = await selectComposition({ serveUrl, id: 'Hangul' });
const files = [];
for (const [i, t] of targets.entries()) {
  const file = join(OUT, `${String(i).padStart(2, '0')}-${t.name}.png`);
  await renderStill({ serveUrl, composition, frame: Math.min(t.frame, composition.durationInFrames - 1), output: file, overwrite: true });
  files.push(file);
  process.stdout.write('.');
}

// 4枚ずつ 2×2 に並べる（半分の解像度）。
// Remotion 同梱の ffmpeg は scale しか持たない最小構成なので、xstack のある ffmpeg を FFMPEG で渡す
const ff = process.env.FFMPEG;
if (!ff) console.log('\n（FFMPEG 未指定のため並べた一覧は作りません）');
for (let s = 0; ff && s * 4 < files.length; s++) {
  const group = files.slice(s * 4, s * 4 + 4);
  while (group.length < 4) group.push(group[group.length - 1]);
  const inputs = group.flatMap((g) => ['-i', g]);
  const filter = group.map((_, i) => `[${i}:v]scale=960:540[v${i}]`).join(';') + ';[v0][v1][v2][v3]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0[out]';
  execFileSync(ff, ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', filter, '-map', '[out]', join(OUT, `sheet-${String(s).padStart(2, '0')}.png`)]);
}
console.log(`\n${files.length}枚 → ${OUT}`);
