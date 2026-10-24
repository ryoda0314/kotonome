import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, FONT } from '../theme';
import { life, move, pop, ramp } from '../anim';
import { CONSONANTS, lerpStrokes, place } from '../jamo';
import { Ink, Text } from '../components/Ink';
import { Jamo, jamoAt, strokeW } from '../components/Hangul';
import { SE, Svg, makeCue } from './common';

// 5つの家族を縦に並べる。下の段ほど線が多い＝息が強い
const COLS = [250, 530, 810, 1090, 1370];
const ROWS = [262, 497, 732];
const SIZE = 130;
const FAMILIES = [
  [['ㄱ', 'カ', 'k'], ['ㅋ', 'カ', 'kʰ', true]],
  [['ㄴ', 'ナ', 'n'], ['ㄷ', 'タ', 't'], ['ㅌ', 'タ', 'tʰ', true]],
  [['ㅁ', 'マ', 'm'], ['ㅂ', 'パ', 'p'], ['ㅍ', 'パ', 'pʰ', true]],
  [['ㅅ', 'サ', 's'], ['ㅈ', 'チャ', 'ch'], ['ㅊ', 'チャ', 'chʰ', true]],
  [['ㅇ', '音なし', ''], ['ㅎ', 'ハ', 'h']],
];

// 14字の一覧（辞書順）
const ALL = [
  ['ㄱ', 'カ', 'k/g'], ['ㄴ', 'ナ', 'n'], ['ㄷ', 'タ', 't/d'], ['ㄹ', 'ラ', 'r/l'], ['ㅁ', 'マ', 'm'], ['ㅂ', 'パ', 'p/b'], ['ㅅ', 'サ', 's'],
  ['ㅇ', '音なし', '—'], ['ㅈ', 'チャ', 'ch/j'], ['ㅊ', 'チャ強', 'chʰ'], ['ㅋ', 'カ強', 'kʰ'], ['ㅌ', 'タ強', 'tʰ'], ['ㅍ', 'パ強', 'pʰ'], ['ㅎ', 'ハ', 'h'],
];
const VOICED = { 'ㄱ': 'ガ', 'ㄷ': 'ダ', 'ㅂ': 'バ', 'ㅈ': 'ジャ' };
const ALL_X = (i) => 190 + (i % 7) * 190;
const ALL_Y = (i) => (i < 7 ? 300 : 600);

const DOUBLES = [['ㄲ', 'ㄱ', 'ッカ', 'kk'], ['ㄸ', 'ㄷ', 'ッタ', 'tt'], ['ㅃ', 'ㅂ', 'ッパ', 'pp'], ['ㅆ', 'ㅅ', 'ッサ', 'ss'], ['ㅉ', 'ㅈ', 'ッチャ', 'jj']];
const D_X = [305, 545, 785, 1025, 1265];

/** 派生した字: 足していない線は上の字の位置から滑り降り、足した線だけ黄色で描かれる */
const Derived = ({ f, ch, cx, cy, fromY, T }) => {
  const add = CONSONANTS[ch].add ?? [];
  const strokes = jamoAt(ch, cx, cy, SIZE);
  const slide = move(f, T, 10);
  const kept = strokes.filter((_, i) => !add.includes(i)).map((st) => st.map(([x, y]) => [x, y + (fromY - cy) * (1 - slide)]));
  const added = strokes.filter((_, i) => add.includes(i));
  const whole = add.length === strokes.length; // ㅍ は形ごと変わる
  return (
    <g>
      <Ink strokes={kept} color={C.cons} width={strokeW(SIZE)} opacity={ramp(f, T, 5)} />
      <Ink strokes={added} color={C.add} width={strokeW(SIZE)} progress={ramp(f, whole ? T : T + 9, whole ? 14 : 10)} />
      <g opacity={pop(f, T + 10)}>
        <circle cx={cx + 74} cy={cy - 66} r={24} fill={C.add} />
        <Text x={cx + 74} y={cy - 68} size={38} font={FONT.sans} weight={900} color="#fff">＋</Text>
      </g>
    </g>
  );
};

const Label = ({ x, y, kana, rom, strong, opacity }) => (
  <Text x={x} y={y} size={36} font={FONT.pop} color={C.ink} opacity={opacity}>
    {kana}
    {strong ? <tspan fontSize={26} fill={C.add}>（強）</tspan> : null}
    {rom ? <tspan fontSize={26} fontFamily={FONT.sans} fill={C.sub} dx={10}>{rom}</tspan> : null}
  </Text>
);

export const Plus = ({ cues }) => {
  const f = useCurrentFrame();
  const { at } = makeCue(cues);
  const pr = at('pr'), pall = at('pall'), pv = at('pv'), pd = at('pd');

  // 派生字が出る時刻（セリフの中の「一本足すと」「もう一本で」に合わせる）
  const when = [
    [null, at('pk', 0.28)],
    [null, at('pt', 0.18), at('pt', 0.6)],
    [null, at('pp', 0.2), at('pp', 0.6)],
    [null, at('pc', 0.12), at('pc', 0.52)],
    [null, at('ph', 0.25)],
  ];

  const familyOpacity = 1 - 0.85 * ramp(f, pr, 8) - 0.15 * ramp(f, pall, 8);
  const allOpacity = ramp(f, pall, 6) * (1 - ramp(f, pd, 8));

  return (
    <AbsoluteFill>
      <Svg>
        {/* 息を強く → 線を1本 */}
        <g opacity={familyOpacity}>
          {FAMILIES.map((fam, c) =>
            fam.map(([ch, kana, rom, strong], r) => {
              const cx = COLS[c], cy = ROWS[r];
              const T = r === 0 ? at('p0') + 4 + c * 3 : when[c][r];
              if (f < T) return null;
              return (
                <g key={ch}>
                  {r === 0 ? (
                    <Jamo ch={ch} cx={cx} cy={cy} size={SIZE} color={C.cons} progress={ramp(f, T, 10)} />
                  ) : (
                    <Derived f={f} ch={ch} cx={cx} cy={cy} fromY={ROWS[r - 1]} T={T} />
                  )}
                  <Label x={cx} y={cy + 96} kana={kana} rom={rom} strong={strong} opacity={ramp(f, T + 12, 8)} />
                </g>
              );
            }),
          )}
          {/* ㅊ が出る前に消す（同じ段の右隣に出るため） */}
          <Text x={884} y={ROWS[2]} size={30} font={FONT.pop} color={C.add} anchor="start" opacity={life(f, at('pp', 0.62) + 14, at('pc', 0.45))}>
            ※形を整えた
          </Text>
        </g>

        {/* ㄹ ≒ ら */}
        <g opacity={life(f, pr, pall, 8)}>
          <rect x={330} y={230} width={910} height={500} rx={36} fill="#fff" stroke={C.faint} strokeWidth={4} />
          <Jamo ch="ㄹ" cx={560} cy={460} size={250} color={C.cons} progress={ramp(f, pr + 4, 14)} />
          <Text x={785} y={460} size={110} font={FONT.sans} weight={900} color={C.sub} opacity={ramp(f, at('pr', 0.55), 6)}>≒</Text>
          <Text x={1010} y={470} size={300} font={FONT.pop} color={C.vowel} opacity={ramp(f, at('pr', 0.55), 6)}
            transform={`translate(1010 470) scale(${pop(f, at('pr', 0.55))}) translate(-1010 -470)`}>ら</Text>
          <Text x={785} y={665} size={48} font={FONT.pop} color={C.ink} opacity={ramp(f, pr + 16, 8)}>ラ行（r / l）</Text>
        </g>

        {/* 子音14字 */}
        <g opacity={allOpacity}>
          {ALL.map(([ch, kana, rom], i) => {
            const x = ALL_X(i), y = ALL_Y(i);
            const k = pop(f, pall + 2 + i * 1.5);
            const hi = VOICED[ch] ? ramp(f, pv + 6, 8) : 0;
            return (
              <g key={ch}>
                {hi > 0 ? <rect x={x - 82} y={y - 82} width={164} height={300} rx={22} fill="#FFF1D6" stroke={C.add} strokeWidth={5} opacity={hi} /> : null}
                <g transform={`translate(${x} ${y}) scale(${k}) translate(${-x} ${-y})`}>
                  <Jamo ch={ch} cx={x} cy={y} size={120} color={C.cons} />
                </g>
                <Text x={x} y={y + 96} size={36} font={FONT.pop} color={C.ink} opacity={k}>{kana}</Text>
                <Text x={x} y={y + 138} size={26} font={FONT.sans} weight={700} color={C.sub} opacity={k}>{rom}</Text>
                {VOICED[ch] ? (
                  <Text x={x} y={y + 182} size={34} font={FONT.pop} color={C.add} opacity={ramp(f, pv + 14, 8)}>{`途中→${VOICED[ch]}`}</Text>
                ) : null}
              </g>
            );
          })}
        </g>

        {/* 双子の字（濃音） */}
        <g opacity={ramp(f, pd, 8)}>
          <Text x={785} y={235} size={60} font={FONT.pop} color={C.ink} outline="#fff">
            同じ字 × 2 ＝ <tspan fill={C.vowel}>つまる音</tspan>
          </Text>
          {DOUBLES.map(([dbl, single, kana, rom], i) => {
            const T = at('pd', 0.12 + i * 0.07);
            if (f < T) return null;
            const cx = D_X[i], cy = 470, s = 170;
            const one = CONSONANTS[single].strokes;
            const loose = [...place(one, cx - s * 0.86, cy - s * 0.43, s * 0.86), ...place(one, cx, cy - s * 0.43, s * 0.86)];
            const st = lerpStrokes(loose, jamoAt(dbl, cx, cy, s), move(f, T + 8, 10));
            return (
              <g key={dbl}>
                <Ink strokes={st} color={C.cons} width={strokeW(s)} opacity={ramp(f, T, 5)} />
                <Text x={cx} y={cy + 150} size={60} font={FONT.pop} color={C.vowel} opacity={ramp(f, T + 14, 8)}>{kana}</Text>
                <Text x={cx} y={cy + 210} size={30} font={FONT.sans} weight={700} color={C.sub} opacity={ramp(f, T + 14, 8)}>{rom}</Text>
              </g>
            );
          })}
        </g>
      </Svg>
      {when.flat().filter(Boolean).map((T, i) => (
        <SE key={i} at={T + 9} name="pop" volume={0.25} />
      ))}
      <SE at={at('pr', 0.55)} name="pop" volume={0.3} />
      <SE at={pv + 6} name="pop" volume={0.25} />
    </AbsoluteFill>
  );
};
