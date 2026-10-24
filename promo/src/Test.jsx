// 図と字形の確認用（本編には出ない）。npx remotion still src/index.js Test out/test.png
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { C } from './theme';
import { SideMouth, FaceFront, sideOverlay, faceOverlay } from './components/Diagrams';
import { Ink } from './components/Ink';
import { Jamo, Syllable } from './components/Hangul';

const CONS = 'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㄲㄸㅃㅆㅉ';
const VOW = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
const WORDS = '김커피라면서울불고기오빠한글안녕하세요간감각왜워의';

export const Test = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <SideMouth cx={190} cy={190} r={170} from="k" to="k" t={1}>
        <Ink strokes={sideOverlay('ㄱ', 190, 190, 170)} color={C.vowel} width={12} />
      </SideMouth>
      <SideMouth cx={550} cy={190} r={170} from="n" to="n" t={1}>
        <Ink strokes={sideOverlay('ㄴ', 550, 190, 170)} color={C.vowel} width={12} />
      </SideMouth>
      <SideMouth cx={910} cy={190} r={170}>
        <Ink strokes={sideOverlay('ㅇ', 910, 190, 170)} color={C.vowel} width={12} />
      </SideMouth>
      <FaceFront cx={1270} cy={190} r={170} mouth="closed" />
      <Ink strokes={faceOverlay('ㅁ', 1270, 190, 170 / 300)} color={C.vowel} width={12} />
      <FaceFront cx={1630} cy={190} r={170} mouth="teeth" />
      <Ink strokes={faceOverlay('ㅅ', 1630, 190, 170 / 300)} color={C.vowel} width={12} />
      {[...CONS].map((ch, i) => (
        <Jamo key={ch} ch={ch} cx={70 + i * 98} cy={450} size={80} color={C.cons} showAdd />
      ))}
      {[...VOW].map((ch, i) => (
        <Jamo key={ch} ch={ch} cx={70 + i * 88} cy={570} size={76} color={C.vowel} />
      ))}
      {[...WORDS].map((ch, i) => (
        <Syllable key={i} ch={ch} cx={80 + (i % 14) * 132} cy={720 + Math.floor(i / 14) * 150} size={116} colorize={1} />
      ))}
    </svg>
  </AbsoluteFill>
);
