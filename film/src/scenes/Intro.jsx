import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, FONT } from '../theme';
import { life, pop, ramp } from '../anim';
import { Syllable } from '../components/Hangul';
import { Jamo } from '../components/Hangul';
import { Text } from '../components/Ink';
import { SE, Svg, makeCue } from './common';

const WALL = '한국어사랑해요김치서울바다하늘친구노래마음학교커피물꽃별감사우리';
const BASE = [
  ['ㄱ', '舌の奥'],
  ['ㄴ', '舌の先'],
  ['ㅁ', '口'],
  ['ㅅ', '歯'],
  ['ㅇ', 'のど'],
];

export const Intro = ({ cues }) => {
  const f = useCurrentFrame();
  const { at, next } = makeCue(cues);
  const i2 = at('i2');
  const i3 = at('i3');

  const wallFade = 1 - 0.85 * ramp(f, i2, 10) - 0.15 * ramp(f, i3, 8);
  const baseLife = life(f, i2 + 6, i3 + 6);
  const titleK = pop(f, i3 + 4);
  const sub = pop(f, i3 + 16);

  return (
    <AbsoluteFill>
      <Svg>
        {/* 記号に見える壁 */}
        <g opacity={wallFade}>
          {[...WALL].map((ch, i) => {
            const col = i % 8, row = Math.floor(i / 8);
            const k = pop(f, 2 + i * 1.2);
            const x = 210 + col * 160 + (row % 2) * 40;
            const y = 230 + row * 170;
            return (
              <g key={i} transform={`translate(${x} ${y}) rotate(${((i * 37) % 21) - 10}) scale(${k}) translate(${-x} ${-y})`}>
                <Syllable ch={ch} cx={x} cy={y} size={112} color="#8C857A" />
              </g>
            );
          })}
        </g>
        <Text x={1450} y={200} size={220} font={FONT.pop} color={C.vowel} outline="#fff" outlineWidth={16} opacity={life(f, 18, i2)}
          transform={`translate(1450 200) rotate(12) scale(${pop(f, 18)}) translate(-1450 -200)`}>？</Text>

        {/* 実は口の形の絵 */}
        <g opacity={baseLife}>
          {BASE.map(([ch, label], i) => {
            const cx = 300 + i * 240;
            return (
              <g key={ch}>
                <Jamo ch={ch} cx={cx} cy={460} size={180} color={C.cons} progress={ramp(f, i2 + 8 + i * 6, 12)} />
                <Text x={cx} y={640} size={52} font={FONT.pop} color={C.ink} outline="#fff" opacity={ramp(f, i2 + 14 + i * 6, 8)}>{label}</Text>
              </g>
            );
          })}
        </g>

        {/* タイトル */}
        <g opacity={ramp(f, i3, 6)}>
          {Array.from({ length: 18 }, (_, i) => {
            const a = (i / 18) * Math.PI * 2 + f * 0.004;
            const p = (r) => `${760 + Math.cos(a) * r} ${470 + Math.sin(a) * r}`;
            const b = a + Math.PI / 18;
            return (
              <path key={i} d={`M760 470 L${p(1400)} L${760 + Math.cos(b) * 1400} ${470 + Math.sin(b) * 1400} Z`} fill="#FFF0C2" opacity={0.7} />
            );
          })}
          <g transform={`translate(760 400) scale(${titleK}) translate(-760 -400)`}>
            <Text x={760} y={400} size={170} font={FONT.pop} color={C.zundaDark} outline="#fff" outlineWidth={26}>爆速ハングル</Text>
          </g>
          <g transform={`translate(760 600) scale(${sub}) translate(-760 -600)`}>
            <rect x={400} y={545} width={720} height={110} rx={55} fill={C.vowel} />
            <Text x={760} y={600} size={66} font={FONT.pop} color="#fff">4分で読めるようになる！</Text>
          </g>
        </g>
      </Svg>
      <SE at={i2 + 8} name="pop" volume={0.25} />
      <SE at={i3 + 4} name="ding" volume={0.35} />
    </AbsoluteFill>
  );
};
