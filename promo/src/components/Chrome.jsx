// 画面の常設部品: 背景・ステップ表示・ずんだもん・字幕
import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { C, FONT } from '../theme';
import { FPS, pop, ramp } from '../anim';

export const Background = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
          <path d="M64 0 L0 0 0 64" fill="none" stroke={C.grid} strokeWidth="2" />
        </pattern>
      </defs>
      <rect width="1920" height="1080" fill="url(#grid)" />
    </svg>
  </AbsoluteFill>
);

export const STEPS = [
  { scene: 'cons', short: '子音' },
  { scene: 'plus', short: '線を足す' },
  { scene: 'vowel', short: '母音' },
  { scene: 'block', short: '組み立て' },
  { scene: 'read', short: '実践' },
];

/** 左上のステップ表示と、右上の進み具合。章の頭で弾んで出る */
export const Header = ({ scenes }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const cur = scenes.find((s) => t >= s.start && t < s.end);
  const idx = STEPS.findIndex((s) => s.scene === cur?.id);
  if (idx < 0) return null;
  const at = Math.round(cur.start * FPS);
  const k = pop(f, at + 4);
  const fade = Math.min(ramp(f, at, 8), 1 - ramp(f, Math.round(cur.end * FPS) - 8, 8));
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <div
        style={{
          position: 'absolute', left: 56, top: 34, display: 'flex', alignItems: 'center', gap: 18,
          transform: `scale(${0.6 + 0.4 * k})`, transformOrigin: 'left center',
        }}
      >
        <div style={{ background: C.zunda, color: '#fff', fontFamily: FONT.pop, fontSize: 38, padding: '6px 20px', borderRadius: 16, letterSpacing: 2 }}>
          STEP {idx + 1}
        </div>
        <div style={{ fontFamily: FONT.pop, fontSize: 60, color: C.ink, WebkitTextStroke: '0px', textShadow: '0 4px 0 #fff' }}>{cur.title}</div>
      </div>
      <div style={{ position: 'absolute', right: 56, top: 46, display: 'flex', gap: 10 }}>
        {STEPS.map((s, i) => (
          <div
            key={s.scene}
            style={{
              fontFamily: FONT.sans, fontWeight: 800, fontSize: 24, padding: '6px 16px', borderRadius: 999,
              background: i === idx ? C.zunda : i < idx ? '#CDEBC9' : '#ECE4D6',
              color: i === idx ? '#fff' : i < idx ? C.zundaDark : '#A39A8A',
            }}
          >
            {s.short}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** 今のセリフ（最後に始まった行）を返す */
const currentLine = (lines, t) => {
  let cur = null;
  for (const l of lines) {
    if (l.start <= t) cur = l;
    else break;
  }
  return cur;
};

/** ずんだもん。口パクは audio_query のモーラ区間から（音声と同じ数値なのでずれない） */
export const Zunda = ({ lines }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const cur = currentLine(lines, t);
  const expr = cur?.expr ?? 'normal';
  const local = cur ? t - cur.start : -1;
  const speaking = cur && local < cur.duration;
  const open = speaking && cur.mouth.some(([a, b]) => local >= a && local < b);
  const bob = speaking ? Math.abs(Math.sin(local * 7)) * -6 : 0;
  return (
    <Img
      src={staticFile(`stand/zunda_${expr}_${open ? 'open' : 'close'}.png`)}
      style={{ position: 'absolute', height: 930, right: -28, top: 452 + bob }}
    />
  );
};

/** 字幕。行が終わっても次の行まで（最大1.4秒）残す */
export const Subtitle = ({ lines }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const i = lines.findIndex((l, j) => l.start <= t && (j + 1 >= lines.length || t < lines[j + 1].start));
  if (i < 0) return null;
  const l = lines[i];
  if (t > l.start + l.duration + 1.4) return null;
  const k = ramp(f, Math.round(l.start * FPS), 4);
  return (
    <div
      style={{
        position: 'absolute', left: 60, width: 1440, bottom: 30, display: 'flex', justifyContent: 'center',
        opacity: k, transform: `translateY(${(1 - k) * 8}px)`,
      }}
    >
      <div
        lang="ja"
        style={{
          background: 'rgba(255,255,255,0.94)', border: `5px solid ${C.zunda}`, borderRadius: 22,
          padding: '12px 30px', maxWidth: 1440, boxShadow: '0 6px 0 rgba(47,125,50,0.25)',
          fontFamily: FONT.sans, fontWeight: 800, fontSize: 44, lineHeight: 1.35, color: C.ink, textAlign: 'center',
          // 2行になるとき「だ。」だけが次の行に落ちないよう、行の長さをそろえ、文節で折る
          textWrap: 'balance', wordBreak: 'auto-phrase',
        }}
      >
        {l.sub}
      </div>
    </div>
  );
};
