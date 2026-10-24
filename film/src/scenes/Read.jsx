import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, FONT } from '../theme';
import { FPS, life, move, pop, ramp } from '../anim';
import { Text } from '../components/Ink';
import { Syllable, wordCenters } from '../components/Hangul';
import { decompose } from '../jamo';
import { SE, Svg, makeCue } from './common';

// [単語, 音節ごとの読み [カナ, ローマ字], 意味]
export const WORDS = [
  ['김', [['キム', 'kim']], '金（キム）さん ＝ 海苔'],
  ['커피', [['コ', 'keo'], ['ピ', 'pi']], 'コーヒー'],
  ['라면', [['ラ', 'ra'], ['ミョン', 'myeon']], 'ラーメン'],
  ['서울', [['ソ', 'seo'], ['ウル', 'ul']], 'ソウル'],
  ['불고기', [['プル', 'pul'], ['ゴ', 'go'], ['ギ', 'gi']], '焼肉のプルコギ'],
  ['오빠', [['オ', 'o'], ['ッパ', 'ppa']], 'お兄さん（女性から）'],
  ['한글', [['ハン', 'han'], ['グル', 'geul']], 'ハングル'],
  ['안녕하세요', [['アン', 'an'], ['ニョン', 'nyeong'], ['ハ', 'ha'], ['セ', 'se'], ['ヨ', 'yo']], 'こんにちは'],
];

const CX = 785, CY = 420;

export const Read = ({ cues, dur }) => {
  const f = useCurrentFrame();
  const { at } = makeCue(cues);
  const r0 = at('r0');

  return (
    <AbsoluteFill>
      <Svg>
        {/* 3秒で読めたら合格 */}
        <g opacity={life(f, r0, at('w1q'))}>
          <g transform={`translate(${CX} 440) scale(${pop(f, r0 + 2)}) translate(${-CX} -440)`}>
            <circle cx={CX} cy={360} r={92} fill="#fff" stroke={C.vowel} strokeWidth={14} />
            <Text x={CX} y={362} size={110} font={FONT.pop} color={C.vowel}>3</Text>
            <Text x={CX} y={560} size={96} font={FONT.pop} color={C.ink} outline="#fff" outlineWidth={18}>秒で読めたら合格！</Text>
          </g>
        </g>

        {WORDS.map(([word, reads, meaning], i) => {
          const q = at(`w${i + 1}q`), a = at(`w${i + 1}a`);
          const out = i + 1 < WORDS.length ? at(`w${i + 2}q`) : dur;
          if (f < q - 2 || f > out + 12) return null;
          const n = [...word].length;
          const size = Math.min(270, (1360 - (n - 1) * 26) / n);
          const xs = wordCenters(n, CX, size, 26);
          const enter = move(f, q, 10), exit = move(f, out, 10);
          const dx = (1 - enter) * 300 - exit * 300;
          const reveal = ramp(f, a, 10);
          // 考える時間の残り（3→1）
          const left = Math.max(0, (a - f) / FPS);
          const thinking = f >= q && f < a;
          return (
            <g key={word} transform={`translate(${dx} 0)`} opacity={enter * (1 - exit)}>
              <Text x={1430} y={170} size={34} font={FONT.sans} weight={800} color={C.sub} anchor="end">{`${i + 1} / ${WORDS.length}`}</Text>
              {[...word].map((ch, j) => (
                // 頭の ㅇ は音なしなので、答えを見せるときに薄くする
                <Syllable key={j} ch={ch} cx={xs[j]} cy={CY} size={size} colorize={reveal} dim={reveal > 0.5 && decompose(ch)[0] === 'ㅇ' ? 'cho' : undefined} />
              ))}
              {thinking ? (
                <g opacity={ramp(f, q + 6, 6)}>
                  <circle cx={CX} cy={CY + size / 2 + 110} r={52} fill="#fff" stroke={C.faint} strokeWidth={10} />
                  <circle
                    cx={CX} cy={CY + size / 2 + 110} r={52} fill="none" stroke={C.vowel} strokeWidth={10}
                    pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.min(1, left / ((a - q) / FPS))}
                    transform={`rotate(-90 ${CX} ${CY + size / 2 + 110})`} strokeLinecap="round"
                  />
                  <Text x={CX} y={CY + size / 2 + 112} size={56} font={FONT.pop} color={C.vowel}>{Math.ceil(left)}</Text>
                </g>
              ) : null}
              {reveal > 0
                ? reads.map(([kana, rom], j) => (
                    <g key={j} opacity={reveal}>
                      <Text x={xs[j]} y={CY + size / 2 + 78} size={Math.min(64, size * 0.36)} font={FONT.pop} color={C.ink}>{kana}</Text>
                      <Text x={xs[j]} y={CY + size / 2 + 130} size={30} font={FONT.sans} weight={700} color={C.sub}>{rom}</Text>
                    </g>
                  ))
                : null}
              <Text x={CX} y={CY + size / 2 + 215} size={48} font={FONT.pop} color={C.final} outline="#fff" opacity={ramp(f, a + 12, 8)}>
                {`＝ ${meaning}`}
              </Text>
            </g>
          );
        })}
      </Svg>
      {WORDS.map((_, i) => {
        const q = at(`w${i + 1}q`), a = at(`w${i + 1}a`);
        const ticks = [];
        for (let t = a - FPS; t > q + 6; t -= FPS) ticks.push(t);
        return (
          <React.Fragment key={i}>
            {ticks.map((t) => <SE key={t} at={t} name="tick" volume={0.25} />)}
            <SE at={a} name="ding" volume={0.3} />
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
