// 効果音を合成して public/se/*.wav に書く（素材の出典・規約を気にしなくて済むよう自前で作る）
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'se');
const RATE = 44100;
mkdirSync(OUT, { recursive: true });

function wav(name, seconds, fn) {
  const n = Math.round(seconds * RATE);
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(RATE, 24); buf.writeUInt32LE(RATE * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const v = fn(t, (f) => (phase += (2 * Math.PI * f) / RATE));
    const fadeIn = Math.min(1, i / 40);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v * fadeIn)) * 32767), 44 + i * 2);
  }
  writeFileSync(join(OUT, name), buf);
}

// ぽんっ（字が出る）
wav('pop.wav', 0.12, (t, adv) => Math.sin(adv(520 + 2600 * t)) * Math.exp(-t * 38) * 0.8);
// カチッ（カウントダウン）
wav('tick.wav', 0.05, (t) => Math.sin(2 * Math.PI * 1800 * t) * Math.exp(-t * 120) * 0.7);
// ピンポン（正解）
wav('ding.wav', 0.7, (t) => {
  const a = Math.sin(2 * Math.PI * 1318.5 * t) * Math.exp(-t * 6);
  const b = t > 0.11 ? Math.sin(2 * Math.PI * 1046.5 * (t - 0.11)) * Math.exp(-(t - 0.11) * 5) : 0;
  return (t < 0.11 ? a : b) * 0.55;
});
// しゅっ（章の切り替え）。ノイズを1次ローパスで丸めて山なりの音量に
let lp = 0;
wav('whoosh.wav', 0.32, (t) => {
  const env = Math.sin(Math.PI * Math.min(1, t / 0.32)) ** 2;
  const k = 0.05 + 0.25 * (t / 0.32);
  lp += k * (Math.random() * 2 - 1 - lp);
  return lp * env * 1.6;
});

console.log(`効果音を書き出しました: ${OUT}`);
