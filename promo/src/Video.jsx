import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import timeline from './generated/timeline.json';
import { FPS, ramp } from './anim';
import { Background, Header, Subtitle, Zunda } from './components/Chrome';
import { SE } from './scenes/common';
import { Intro } from './scenes/Intro';
import { Cons } from './scenes/Cons';
import { Plus } from './scenes/Plus';
import { Vowel } from './scenes/Vowel';
import { Block } from './scenes/Block';
import { Read } from './scenes/Read';
import { Outro } from './scenes/Outro';

const SCENES = { intro: Intro, cons: Cons, plus: Plus, vowel: Vowel, block: Block, read: Read, outro: Outro };
const fr = (s) => Math.round(s * FPS);

/** 章ごとのセリフを「章の頭からのフレーム」に直す */
function sceneCues(scene) {
  const from = fr(scene.start);
  const dur = fr(scene.end) - from;
  const lines = timeline.lines.filter((l) => l.scene === scene.id);
  const cues = {};
  lines.forEach((l, i) => {
    cues[l.id] = {
      from: fr(l.start) - from,
      dur: fr(l.duration),
      next: i + 1 < lines.length ? fr(lines[i + 1].start) - from : dur,
    };
  });
  return { from, dur, cues };
}

const Fade = ({ dur, last, children }) => {
  const f = useCurrentFrame();
  const o = Math.min(ramp(f, 0, 8), last ? 1 : 1 - ramp(f, dur - 8, 8));
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

// BGM（概要欄のクレジットは out/youtube.md に）。音量は解説動画プロジェクトの実測ラウドネス比に合わせる
const BGM_BASE = 0.075;
const BGM = [
  { file: 'bgm/nc20349_otenba-koimusume.mp3', gain: 0.9, trim: 2.0, scenes: ['intro'] },
  { file: 'bgm/nc116360_honobono-waltz.wav', gain: 1.0, trim: 0, scenes: ['cons', 'plus', 'vowel', 'block'] },
  { file: 'bgm/nc20349_otenba-koimusume.mp3', gain: 0.9, trim: 2.0, scenes: ['read'] },
  { file: 'bgm/nc90501_saigetsu-machi.mp3', gain: 0.68, trim: 0, scenes: ['outro'] },
];

export const Video = () => {
  const sc = Object.fromEntries(timeline.scenes.map((s) => [s.id, s]));
  return (
    <AbsoluteFill>
      <Background />
      {timeline.scenes.map((s, i) => {
        const { from, dur, cues } = sceneCues(s);
        const Comp = SCENES[s.id];
        return (
          <Sequence key={s.id} from={from} durationInFrames={dur} name={s.id}>
            <Fade dur={dur} last={i === timeline.scenes.length - 1}>
              <Comp cues={cues} dur={dur} />
            </Fade>
          </Sequence>
        );
      })}
      <Header scenes={timeline.scenes} />

      {timeline.lines.map((l) => (
        <Sequence key={l.id} from={fr(l.start)} durationInFrames={Math.ceil(l.duration * FPS) + 6} layout="none" name={`voice ${l.id}`}>
          <Audio src={staticFile(l.file)} />
        </Sequence>
      ))}
      {BGM.map((b, i) => {
        const from = fr(sc[b.scenes[0]].start);
        const to = fr(sc[b.scenes[b.scenes.length - 1]].end);
        const dur = to - from + (i === BGM.length - 1 ? 0 : 15);
        const v = BGM_BASE * b.gain;
        return (
          <Sequence key={i} from={from} durationInFrames={dur} layout="none" name={`bgm ${i}`}>
            <Audio
              src={staticFile(b.file)}
              trimBefore={fr(b.trim)}
              loop
              volume={(f) => v * interpolate(f, [0, 12, dur - 20, dur], [0, 1, 1, i === BGM.length - 1 ? 1 : 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
            />
          </Sequence>
        );
      })}
      {timeline.scenes.slice(1).map((s) => (
        <SE key={s.id} at={fr(s.start)} name="whoosh" volume={0.22} />
      ))}

      <Zunda lines={timeline.lines} />
      <Subtitle lines={timeline.lines} />
    </AbsoluteFill>
  );
};

export const DURATION = timeline.durationInFrames;
