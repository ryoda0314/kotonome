import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, FONT } from '../theme';
import { life, pop, ramp } from '../anim';
import { Ink, Text } from '../components/Ink';
import { Syllable, jamoAt, strokeW, wordCenters } from '../components/Hangul';
import { SE, Svg, makeCue } from './common';
import { WORDS } from './Read';

// 早見表（最後に止めてスクショできるように）
const SHEET = [
  { title: '子音', color: C.cons, items: [['ㄱ', 'カ'], ['ㄴ', 'ナ'], ['ㄷ', 'タ'], ['ㄹ', 'ラ'], ['ㅁ', 'マ'], ['ㅂ', 'パ'], ['ㅅ', 'サ'], ['ㅇ', '無音'], ['ㅈ', 'チャ'], ['ㅊ', 'チャ強'], ['ㅋ', 'カ強'], ['ㅌ', 'タ強'], ['ㅍ', 'パ強'], ['ㅎ', 'ハ']] },
  { title: '双子', color: C.cons, items: [['ㄲ', 'ッカ'], ['ㄸ', 'ッタ'], ['ㅃ', 'ッパ'], ['ㅆ', 'ッサ'], ['ㅉ', 'ッチャ']], note: ['語中の ㄱㄷㅂㅈ は濁る', '（ガ・ダ・バ・ジャ）'] },
  { title: '母音', color: C.vowel, items: [['ㅏ', 'ア'], ['ㅑ', 'ヤ'], ['ㅓ', 'オ大'], ['ㅕ', 'ヨ大'], ['ㅗ', 'オ'], ['ㅛ', 'ヨ'], ['ㅜ', 'ウ'], ['ㅠ', 'ユ'], ['ㅡ', 'ウ横'], ['ㅣ', 'イ']] },
  { title: '合体', color: C.vowel, items: [['ㅐ', 'エ'], ['ㅔ', 'エ'], ['ㅒ', 'イェ'], ['ㅖ', 'イェ'], ['ㅘ', 'ワ'], ['ㅙ', 'ウェ'], ['ㅚ', 'ウェ'], ['ㅝ', 'ウォ'], ['ㅞ', 'ウェ'], ['ㅟ', 'ウィ'], ['ㅢ', 'ウイ']] },
  { title: 'パッチム', color: C.final, items: [['ㄴ', 'ン'], ['ㅁ', 'ン'], ['ㅇ', 'ン'], ['ㄱ', 'ッ'], ['ㄷ', 'ッ'], ['ㅂ', 'ッ'], ['ㄹ', 'ル']], note: ['ン：アンナ・サンマ・マンガ', 'ッ：ハッカ・ハッタ・ハッパ'] },
];

export const Outro = ({ cues }) => {
  const f = useCurrentFrame();
  const { at } = makeCue(cues);
  const o1 = at('o1'), o2 = at('o2'), o3 = at('o3');

  return (
    <AbsoluteFill>
      <Svg>
        {/* もう読める！ */}
        <g opacity={life(f, o1, o2)}>
          <g transform={`translate(785 250) scale(${pop(f, o1 + 2)}) translate(-785 -250)`}>
            <Text x={785} y={250} size={150} font={FONT.pop} color={C.zundaDark} outline="#fff" outlineWidth={24}>もう読める！</Text>
          </g>
          {WORDS.map(([w], i) => {
            const n = [...w].length;
            const row = i < 4 ? 0 : 1;
            const slot = row === 0 ? i : i - 4;
            const cx = 200 + slot * 350;
            const cy = 500 + row * 190 + Math.sin(f * 0.12 + i) * 6;
            const size = Math.min(110, 300 / n);
            const xs = wordCenters(n, cx, size, 8);
            return (
              <g key={w} opacity={pop(f, o1 + 6 + i * 2)}>
                {[...w].map((ch, j) => <Syllable key={j} ch={ch} cx={xs[j]} cy={cy} size={size} colorize={1} />)}
              </g>
            );
          })}
        </g>

        {/* 訓民正音解例本の序 */}
        <g opacity={life(f, o2, o3)}>
          <rect x={250} y={170} width={1070} height={640} rx={30} fill="#FFFDF7" stroke="#C9B48A" strokeWidth={6} />
          <rect x={272} y={192} width={1026} height={596} rx={20} fill="none" stroke="#E2D2AE" strokeWidth={3} />
          <Text x={785} y={250} size={36} font={FONT.sans} weight={800} color={C.sub}>『訓民正音 解例本』（1446年）鄭麟趾の序より</Text>
          <Text x={785} y={370} size={80} font={FONT.serif} weight={700} color={C.ink} opacity={ramp(f, o2 + 6, 10)}>智者不終朝而會</Text>
          <Text x={785} y={480} size={80} font={FONT.serif} weight={700} color={C.ink} opacity={ramp(f, at('o2', 0.45), 10)}>愚者可浹旬而學</Text>
          <Text x={785} y={610} size={48} font={FONT.pop} color={C.vowel} opacity={ramp(f, at('o2', 0.2), 10)}>賢い人なら、朝のうちに。</Text>
          <Text x={785} y={690} size={48} font={FONT.pop} color={C.vowel} opacity={ramp(f, at('o2', 0.55), 10)}>そうでなくても、10日で覚えられる。</Text>
        </g>

        {/* 早見表 */}
        <g opacity={ramp(f, o3, 10)}>
          <Text x={70} y={72} size={58} font={FONT.pop} color={C.ink} anchor="start" outline="#fff">
            保存版 <tspan fill={C.zundaDark}>ハングル早見表</tspan>
          </Text>
          {SHEET.map((row, r) => {
            const y = 190 + r * 148;
            return (
              <g key={row.title} opacity={ramp(f, o3 + 4 + r * 4, 8)}>
                <rect x={60} y={y - 58} width={150} height={124} rx={18} fill={row.color} opacity={0.12} />
                <Text x={135} y={y + 4} size={row.title.length > 3 ? 32 : 40} font={FONT.pop} color={row.color}>{row.title}</Text>
                {row.items.map(([ch, kana], i) => {
                  const x = 268 + i * 88;
                  return (
                    <g key={i}>
                      <Ink strokes={jamoAt(ch, x, y - 12, 62)} color={row.color} width={strokeW(62)} />
                      <Text x={x} y={y + 46} size={kana.length > 2 ? 21 : 26} font={FONT.pop} color={C.ink}>{kana}</Text>
                    </g>
                  );
                })}
                {(row.note ?? []).map((line, j) => (
                  <Text key={j} x={268 + row.items.length * 88 + 10} y={y - 20 + j * 42} size={30} font={FONT.pop} color={C.sub} anchor="start">{line}</Text>
                ))}
              </g>
            );
          })}
        </g>
      </Svg>
      <SE at={o1 + 2} name="ding" volume={0.3} />
    </AbsoluteFill>
  );
};
