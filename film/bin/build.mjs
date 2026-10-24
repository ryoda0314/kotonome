// script.mjs → VOICEVOX で1行ずつ合成 → src/generated/timeline.json
//
// 尺と口パクは audio_query のモーラ長から出す（音量や等間隔で作ると必ずずれる）。
// 音声は「読み上げ文＋声パラメータ」の sha1 でキャッシュするので、字幕(sub)だけの修正は再合成ゼロ。
//
//   node bin/build.mjs            合成してタイムラインを書く
//   node bin/build.mjs --force    キャッシュを無視して全部合成し直す

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCENES, VOICE } from '../script.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENGINE = (process.env.VOICEVOX_URL || 'http://127.0.0.1:50021').replace(/\/+$/, '');
const FPS = 30;
const LEAD_IN = 0.5; // 冒頭の無音
const SCENE_GAP = 0.45; // 章の切り替えアニメーションに使う間
const FORCE = process.argv.includes('--force');

// 既存の解説動画プロジェクトから立ち絵とBGMを借りる（無ければ立ち絵はプレースホルダー）
const EXPLANATION = 'C:/Users/edama/Desktop/作品,app/explanation/public';

const voiceDir = join(ROOT, 'public', 'voice');
const cacheDir = join(ROOT, '.cache', 'query');
for (const d of [voiceDir, cacheDir, join(ROOT, 'src', 'generated'), join(ROOT, 'public', 'stand'), join(ROOT, 'public', 'bgm')]) {
  mkdirSync(d, { recursive: true });
}

async function post(url, body) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);
      return res;
    } catch (err) {
      if (attempt >= 2) throw new Error(`VOICEVOX ${url.split('?')[0]} に失敗: ${err.message}\nVOICEVOX を起動して ${ENGINE} が応答するか確認してください`);
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
}

// timing.mjs（explanation）と同じ規則: 母音が鳴っている区間だけ口を開く
const SILENT = new Set(['', 'n', 'N', 'cl', 'pau', 'sil']);
function analyze(query) {
  const sp = query.speedScale || 1;
  let t = (query.prePhonemeLength || 0) / sp;
  const mouth = [];
  for (const phrase of query.accent_phrases || []) {
    for (const mora of phrase.moras || []) {
      t += (mora.consonant_length || 0) / sp;
      const v = (mora.vowel_length || 0) / sp;
      if (!SILENT.has(String(mora.vowel || '')) && v > 0) mouth.push([+t.toFixed(3), +(t + v).toFixed(3)]);
      t += v;
    }
    if (phrase.pause_mora) t += (phrase.pause_mora.vowel_length || 0) / sp;
  }
  t += (query.postPhonemeLength || 0) / sp;
  return { duration: +t.toFixed(3), mouth };
}

async function synth(line) {
  const key = createHash('sha1')
    .update(JSON.stringify([line.say, VOICE.speaker, VOICE.speed, VOICE.pitch, VOICE.intonation, VOICE.volume]))
    .digest('hex')
    .slice(0, 16);
  const wav = join(voiceDir, `${key}.wav`);
  const qfile = join(cacheDir, `${key}.json`);
  if (!FORCE && existsSync(wav) && existsSync(qfile)) {
    return { key, query: JSON.parse(readFileSync(qfile, 'utf8')), cached: true };
  }
  const q = await (await post(`${ENGINE}/audio_query?speaker=${VOICE.speaker}&text=${encodeURIComponent(line.say)}`)).json();
  q.speedScale = VOICE.speed;
  q.pitchScale = VOICE.pitch;
  q.intonationScale = VOICE.intonation;
  q.volumeScale = VOICE.volume;
  q.prePhonemeLength = 0.05;
  q.postPhonemeLength = 0.08;
  const audio = Buffer.from(await (await post(`${ENGINE}/synthesis?speaker=${VOICE.speaker}`, q)).arrayBuffer());
  writeFileSync(wav, audio);
  writeFileSync(qfile, JSON.stringify(q));
  return { key, query: q, cached: false };
}

function copyAssets() {
  const exprs = ['normal', 'happy', 'excited', 'surprised', 'troubled', 'doya'];
  let n = 0;
  for (const e of exprs) {
    for (const m of ['open', 'close']) {
      const f = `zunda_${e}_${m}.png`;
      const src = join(EXPLANATION, 'stand', f);
      const dst = join(ROOT, 'public', 'stand', f);
      if (existsSync(src) && !existsSync(dst)) copyFileSync(src, dst);
      if (existsSync(dst)) n++;
    }
  }
  for (const f of ['nc20349_otenba-koimusume.mp3', 'nc116360_honobono-waltz.wav', 'nc90501_saigetsu-machi.mp3']) {
    const src = join(EXPLANATION, 'bgm', f);
    const dst = join(ROOT, 'public', 'bgm', f);
    if (existsSync(src) && !existsSync(dst)) copyFileSync(src, dst);
  }
  return n;
}

async function main() {
  const ids = new Set();
  for (const s of SCENES) for (const l of s.lines) {
    if (ids.has(l.id)) throw new Error(`id が重複: ${l.id}`);
    ids.add(l.id);
    if (/[\u3131-\u318E\uAC00-\uD7A3]/.test(l.say)) throw new Error(`say にハングルがある（VOICEVOX は読めない）: ${l.id} ${l.say}`);
  }

  const standCount = copyAssets();
  let made = 0, reused = 0;
  let cursor = LEAD_IN;
  const lines = [];
  const scenes = [];

  for (const [si, scene] of SCENES.entries()) {
    if (si > 0) cursor += SCENE_GAP;
    const sceneStart = Math.max(0, cursor - (si === 0 ? LEAD_IN : SCENE_GAP / 2));
    for (const line of scene.lines) {
      const { key, query, cached } = await synth(line);
      cached ? reused++ : made++;
      const { duration, mouth } = analyze(query);
      lines.push({
        id: line.id,
        scene: scene.id,
        say: line.say,
        sub: line.sub ?? line.say,
        expr: line.expr ?? 'normal',
        file: `voice/${key}.wav`,
        start: +cursor.toFixed(3),
        duration,
        mouth,
      });
      cursor += duration + (line.pause ?? 0) + VOICE.gap;
      process.stdout.write(cached ? '.' : '+');
    }
    scenes.push({ id: scene.id, title: scene.title, start: +sceneStart.toFixed(3) });
  }
  const total = +(cursor + 0.2).toFixed(3);
  for (let i = 0; i < scenes.length; i++) scenes[i].end = i + 1 < scenes.length ? scenes[i + 1].start : total;

  const timeline = { fps: FPS, duration: total, durationInFrames: Math.ceil(total * FPS), scenes, lines };
  writeFileSync(join(ROOT, 'src', 'generated', 'timeline.json'), JSON.stringify(timeline, null, 1));

  const mm = Math.floor(total / 60), ss = (total % 60).toFixed(1).padStart(4, '0');
  console.log(`\n合成 ${made}件・キャッシュ再利用 ${reused}件 / ${lines.length}行・尺 ${mm}:${ss}（${timeline.durationInFrames}フレーム）・立ち絵 ${standCount}/12枚`);
  for (const s of scenes) console.log(`  ${s.id.padEnd(6)} ${s.start.toFixed(1).padStart(6)}s → ${s.end.toFixed(1).padStart(6)}s  (${(s.end - s.start).toFixed(1)}s)`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
