// 書き出した MP4 の音量を YouTube 向けに持ち上げる（映像は再エンコードしない）。
//   render 直後は約 -22.6 LUFS。YouTube は小さい動画を持ち上げないので、他の動画より明らかに小さく聞こえる。
//   +7dB して、声の破裂音の山だけリミッターで -1.5dBFS に抑える → 約 -16 LUFS・True peak -1.3dBFS（実測）。
//   声とBGMの差（約11.5dB）は変わらない（全体に同じ利得をかけるだけなので）。
// 使い方: FFMPEG=<ffmpeg.exe> node bin/finish.mjs   （Remotion 同梱の ffmpeg は alimiter を持たない）
import { execFileSync, spawnSync } from 'node:child_process';
import { renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ff = process.env.FFMPEG;
if (!ff) throw new Error('FFMPEG に alimiter / ebur128 を持つ ffmpeg のパスを指定してください');
const out = join(ROOT, 'out', 'hangul.mp4');
const raw = join(ROOT, 'out', 'hangul-raw.mp4');
renameSync(out, raw);
execFileSync(ff, ['-hide_banner', '-loglevel', 'error', '-y', '-i', raw, '-c:v', 'copy',
  '-af', 'volume=7dB,alimiter=limit=0.84:attack=5:release=60:level=false', '-c:a', 'aac', '-b:a', '192k', out]);
// ebur128 の集計は stderr に出る
const { stderr } = spawnSync(ff, ['-hide_banner', '-nostats', '-i', out, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' });
const summary = stderr.slice(stderr.lastIndexOf('Summary:'));
const I = summary.match(/I:\s+(-?[\d.]+) LUFS/)?.[1];
const peak = summary.match(/Peak:\s+(-?[\d.]+) dBFS/)?.[1];
console.log(`仕上げ済み: ${out}  I=${I} LUFS / True peak=${peak} dBFS`);
