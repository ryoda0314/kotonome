import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, FONT, ROLE_COLOR } from '../theme';
import { life, lerp, move, ramp } from '../anim';
import { CONSONANTS, bbox, lerpStrokes, place } from '../jamo';
import { Ink, Text } from '../components/Ink';
import { Assemble, Jamo, Syllable, strokeW, syllableParts } from '../components/Hangul';
import { SE, Svg, makeCue } from './common';

const Plus = ({ x, y, opacity, ch = '＋' }) => (
  <Text x={x} y={y} size={80} font={FONT.sans} weight={900} color={C.sub} opacity={opacity}>{ch}</Text>
);

/** ブロックの中で、子音と母音が占める範囲を点線で示す */
const Guides = ({ ch, cx, cy, size, opacity }) => {
  const [c, v] = syllableParts(ch, cx, cy, size);
  const box = (strokes, pad) => {
    const [x0, y0, x1, y1] = bbox(strokes);
    return [x0 - pad, y0 - pad, x1 - x0 + pad * 2, y1 - y0 + pad * 2];
  };
  const [ax, ay, aw, ah] = box(c.strokes, 18);
  const [bx, by, bw, bh] = box(v.strokes, 18);
  return (
    <g opacity={opacity} fill="none" strokeWidth={4} strokeDasharray="10 8">
      <rect x={ax} y={ay} width={aw} height={ah} rx={12} stroke={C.cons} />
      <rect x={bx} y={by} width={bw} height={bh} rx={12} stroke={C.vowel} />
    </g>
  );
};

// パッチムの7つ。ン3つ・ッ3つ・ㄹ
const FINALS = [
  { ch: 'ㄴ', syl: '안', word: ['ア', 'ン', 'ナ'], rom: 'an', group: 0 },
  { ch: 'ㅁ', syl: '암', word: ['サ', 'ン', 'マ'], rom: 'am', group: 0 },
  { ch: 'ㅇ', syl: '앙', word: ['マ', 'ン', 'ガ'], rom: 'ang', group: 0 },
  { ch: 'ㄱ', syl: '악', word: ['ハ', 'ッ', 'カ'], rom: 'ak', group: 1 },
  { ch: 'ㄷ', syl: '앋', word: ['ハ', 'ッ', 'タ'], rom: 'at', group: 1 },
  { ch: 'ㅂ', syl: '압', word: ['ハ', 'ッ', 'パ'], rom: 'ap', group: 1 },
  { ch: 'ㄹ', syl: '알', word: ['', 'ル', ''], rom: 'al', group: 2 },
];
const FX = [200, 385, 570, 790, 975, 1160, 1380];
const KIN = { 'ㄱ': ['ㅋ', 'ㄲ'], 'ㄷ': ['ㅅ', 'ㅆ', 'ㅈ', 'ㅊ', 'ㅌ', 'ㅎ'], 'ㅂ': ['ㅍ'] };

export const Block = ({ cues }) => {
  const f = useCurrentFrame();
  const { at } = makeCue(cues);
  const b0 = at('b0'), b1 = at('b1'), b2 = at('b2'), f0 = at('f0'), f1 = at('f1');

  // ── 1. ㄱ＋ㅏ → 가 ──
  const v1 = life(f, b0, b1);
  const join = move(f, at('b0', 0.42), 16);

  // ── 4. 가＋ㄴ → 간 ──
  const gaParts = syllableParts('가', 420, 470, 250);
  const nLoose = place(CONSONANTS['ㄴ'].strokes, 640, 400, 140);
  const ganTo = syllableParts('간', 1150, 470, 300);
  const tGan = move(f, at('f0', 0.45), 16);
  const wGan = lerp(strokeW(250), strokeW(300), tGan);

  return (
    <AbsoluteFill>
      <Svg>
        {/* 1. へんとつくり */}
        <g opacity={v1}>
          <Jamo ch="ㄱ" cx={360} cy={450} size={200} color={C.cons} progress={ramp(f, b0 + 2, 10)} />
          <Plus x={540} y={450} opacity={ramp(f, b0 + 8, 6)} />
          <Jamo ch="ㅏ" cx={700} cy={450} size={200} color={C.vowel} progress={ramp(f, b0 + 10, 10)} />
          <Plus x={900} y={450} opacity={ramp(f, at('b0', 0.42), 6)} ch="→" />
          {f >= at('b0', 0.42) ? <Assemble ch="가" loose={[[360, 450, 200], [700, 450, 200]]} cx={1170} cy={450} size={300} t={join} /> : null}
          <g opacity={ramp(f, at('b0', 0.6), 8)}>
            <Text x={785} y={720} size={64} font={FONT.serif} weight={700} color={C.ink}>
              <tspan fill={C.cons}>女</tspan> ＋ <tspan fill={C.vowel}>子</tspan> → 好
            </Text>
            <Text x={785} y={790} size={30} font={FONT.pop} color={C.sub}>漢字のへん＋つくりと同じ</Text>
          </g>
        </g>

        {/* 2. 縦長は右、横長は下 */}
        <g opacity={life(f, b1, b2)}>
          {[['가', 470, '縦長の母音 → 右', b1 + 2], ['고', 1100, '横長の母音 → 下', at('b1', 0.5)]].map(([ch, x, label, T]) => (
            <g key={ch} opacity={ramp(f, T, 6)}>
              <Syllable ch={ch} cx={x} cy={430} size={280} colorize={1} progress={ramp(f, T, 14)} />
              <Guides ch={ch} cx={x} cy={430} size={280} opacity={ramp(f, T + 14, 8)} />
              <Text x={x} y={660} size={52} font={FONT.pop} color={C.ink} outline="#fff">{label}</Text>
            </g>
          ))}
        </g>

        {/* 3. 母音だけなら ㅇ をつける */}
        <g opacity={life(f, b2, f0)}>
          <Text x={785} y={220} size={56} font={FONT.pop} color={C.ink} outline="#fff">
            母音だけ → <tspan fill={C.cons}>ㅇ</tspan>（音なし）をつける
          </Text>
          {['아', '오', '우', '이'].map((ch, i) => {
            const x = 380 + i * 270;
            const T = at('b2', 0.62 + i * 0.09);
            return (
              <g key={ch}>
                <Syllable ch={ch} cx={x} cy={450} size={210} colorize={1} progress={ramp(f, b2 + 6 + i * 4, 12)} />
                <Text x={x} y={640} size={64} font={FONT.pop} color={C.vowel} opacity={ramp(f, T, 6)}>{['ア', 'オ', 'ウ', 'イ'][i]}</Text>
              </g>
            );
          })}
        </g>

        {/* 4. パッチムは一番下 */}
        <g opacity={life(f, f0, f1)}>
          {f < at('f0', 0.45) ? (
            <>
              {gaParts.map((p, i) => <Ink key={i} strokes={p.strokes} color={ROLE_COLOR[p.role]} width={strokeW(250)} progress={ramp(f, f0 + 2, 10)} />)}
              <Ink strokes={nLoose} color={C.final} width={strokeW(140)} progress={ramp(f, f0 + 12, 10)} />
            </>
          ) : (
            <>
              {/* 元の 가＋ㄴ は薄く残す（何から何ができたか分かるように） */}
              <g opacity={0.25}>
                {gaParts.map((p, i) => <Ink key={i} strokes={p.strokes} color={ROLE_COLOR[p.role]} width={strokeW(250)} />)}
                <Ink strokes={nLoose} color={C.final} width={strokeW(140)} />
              </g>
              {[...gaParts, { role: 'jong', strokes: nLoose }].map((p, i) => (
                <Ink key={i} strokes={lerpStrokes(p.strokes, ganTo[i].strokes, tGan)} color={ROLE_COLOR[p.role]} width={wGan} />
              ))}
            </>
          )}
          <Plus x={900} y={470} ch="→" opacity={ramp(f, at('f0', 0.4), 6)} />
          <Text x={1150} y={700} size={52} font={FONT.pop} color={C.final} outline="#fff" opacity={ramp(f, at('f0', 0.62), 8)}>
            パッチム（最後の子音）
          </Text>
        </g>

        {/* 5. パッチムの読み方は7つ */}
        <g opacity={ramp(f, f1, 8)}>
          {[['ン', 200, 570, 'fn'], ['ッ', 790, 1160, 'ft'], ['ル', 1380, 1380, 'fl']].map(([h, xa, xb, id]) => (
            <g key={h} opacity={ramp(f, f1 + 4, 8)}>
              <rect x={xa - 80} y={160} width={xb - xa + 160} height={70} rx={35} fill={id === 'fl' ? '#E7F6EA' : '#E7F6EA'} />
              <Text x={(xa + xb) / 2} y={196} size={50} font={FONT.pop} color={C.final}>{h}</Text>
            </g>
          ))}
          {FINALS.map((F, i) => {
            const x = FX[i];
            const show = F.group === 0 ? at('fn', 0.15 + (i % 3) * 0.25) : F.group === 1 ? at('ft', 0.15 + (i % 3) * 0.25) : at('fl', 0.1);
            const word = F.word;
            return (
              <g key={F.ch}>
                <Jamo ch={F.ch} cx={x} cy={318} size={100} color={C.final} progress={ramp(f, f1 + 6 + i * 3, 10)} />
                <g opacity={ramp(f, show, 8)}>
                  <Syllable ch={F.syl} cx={x} cy={490} size={140} colorize={1} />
                  <Text x={x} y={620} size={44} font={FONT.pop} color={C.ink}>
                    {word[0]}<tspan fill={C.final}>{word[1]}</tspan>{word[2]}
                  </Text>
                  <Text x={x} y={668} size={28} font={FONT.sans} weight={700} color={C.sub}>{F.rom}</Text>
                </g>
              </g>
            );
          })}
          {/* 仲間 */}
          <g opacity={ramp(f, at('fr', 0.2), 10)}>
            <Text x={110} y={770} size={34} font={FONT.pop} color={C.sub} anchor="start">仲間 →</Text>
            {Object.entries(KIN).map(([lead, kin]) => {
              const x = FX[FINALS.findIndex((F) => F.ch === lead)];
              return kin.map((ch, j) => {
                const col = j % 3, row = Math.floor(j / 3);
                const n = Math.min(kin.length, 3);
                return <Jamo key={ch} ch={ch} cx={x + (col - (n - 1) / 2) * 58} cy={752 + row * 58} size={46} color={C.sub} />;
              });
            })}
          </g>
        </g>
      </Svg>
      <SE at={at('b0', 0.42) + 14} name="pop" volume={0.3} />
      <SE at={at('f0', 0.45) + 14} name="pop" volume={0.3} />
      {FINALS.map((F, i) => (
        <SE key={i} at={F.group === 0 ? at('fn', 0.15 + (i % 3) * 0.25) : F.group === 1 ? at('ft', 0.15 + (i % 3) * 0.25) : at('fl', 0.1)} name="pop" volume={0.22} />
      ))}
    </AbsoluteFill>
  );
};
