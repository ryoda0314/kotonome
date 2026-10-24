import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, FONT } from '../theme';
import { life, lerp, move, pop, ramp } from '../anim';
import { jamoStrokes, lerpStrokes, place } from '../jamo';
import { Ink, Text } from '../components/Ink';
import { jamoAt, strokeW } from '../components/Hangul';
import { SE, Svg, makeCue } from './common';

const len = (st) => Math.hypot(st[1][0] - st[0][0], st[1][1] - st[0][1]);
const segDist = ([px, py], [[ax, ay], [bx, by]]) => {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};

/**
 * 母音を「長い棒（地・人）を引く → 点（天）を置く → 点が短い棒に伸びる」で組み立てる。
 * 短い棒は棒の付け根から外へ向かって描く（点の位置で終わる）。
 */
const VowelBuild = ({ f, ch, cx, cy, size, T }) => {
  const strokes = jamoAt(ch, cx, cy, size);
  const L = Math.max(...strokes.map(len));
  const base = strokes.filter((s) => len(s) > L * 0.55);
  const ticks = strokes
    .filter((s) => len(s) <= L * 0.55)
    .map((s) => {
      const d0 = Math.min(...base.map((b) => segDist(s[0], b)));
      const d1 = Math.min(...base.map((b) => segDist(s[1], b)));
      return d0 <= d1 ? s : [s[1], s[0]];
    });
  const w = strokeW(size);
  const grow = ramp(f, T + 14, 9);
  return (
    <g>
      <Ink strokes={base} color={C.vowel} width={w} progress={ramp(f, T, 8)} />
      <Ink strokes={ticks} color={C.vowel} width={w} progress={grow} />
      {ticks.map((s, i) => {
        const r = w * 0.95 * pop(f, T + 7) * (1 - grow);
        return r > 0.5 ? <circle key={i} cx={s[1][0]} cy={s[1][1]} r={r} fill={C.vowel} /> : null;
      })}
    </g>
  );
};

const TOP = [['ㅏ', 'ア', 'a'], ['ㅓ', 'オ', 'eo'], ['ㅗ', 'オ', 'o'], ['ㅜ', 'ウ', 'u'], ['ㅡ', 'ウ', 'eu'], ['ㅣ', 'イ', 'i']];
const BOT = [['ㅑ', 'ヤ', 'ya'], ['ㅕ', 'ヨ', 'yeo'], ['ㅛ', 'ヨ', 'yo'], ['ㅠ', 'ユ', 'yu']];
const XS = [190, 400, 610, 820, 1030, 1240];
const Y1 = 320, Y2 = 640, SIZE = 150;

const EQS = [
  ['ㅏ', 'ㅣ', 'ㅐ', 'エ', 'vve', 0.0], ['ㅓ', 'ㅣ', 'ㅔ', 'エ', 'vve', 0.34],
  ['ㅗ', 'ㅏ', 'ㅘ', 'ワ', 'vvw', 0.0], ['ㅜ', 'ㅓ', 'ㅝ', 'ウォ', 'vvw', 0.45],
  ['ㅜ', 'ㅣ', 'ㅟ', 'ウィ', 'vvi', 0.0], ['ㅡ', 'ㅣ', 'ㅢ', 'ウイ', 'vvi', 0.28],
];
const REST = [['ㅒ', 'イェ'], ['ㅖ', 'イェ'], ['ㅙ', 'ウェ'], ['ㅚ', 'ウェ'], ['ㅞ', 'ウェ']];

/** 口の形のアイコン（大きく開ける／すぼめる／横に引く） */
const Mouth = ({ x, y, kind, label, opacity }) => (
  <g opacity={opacity}>
    {kind === 'open' ? <ellipse cx={x} cy={y} rx={30} ry={38} fill={C.cavity} stroke="#E86A7A" strokeWidth={10} /> : null}
    {kind === 'round' ? <circle cx={x} cy={y} r={14} fill={C.cavity} stroke="#E86A7A" strokeWidth={14} /> : null}
    {kind === 'wide' ? <ellipse cx={x} cy={y} rx={46} ry={11} fill={C.cavity} stroke="#E86A7A" strokeWidth={10} /> : null}
    <Text x={x} y={y + 64} size={30} font={FONT.pop} color={C.ink} outline="#fff">{label}</Text>
  </g>
);

export const Vowel = ({ cues }) => {
  const f = useCurrentFrame();
  const { at } = makeCue(cues);
  const va = at('va'), vv0 = at('vv0');

  // ── 天・地・人 ──
  const partsOn = 1 - ramp(f, va, 8);
  const v1 = (x) => at('v1', x);
  const ray = ramp(f, v1(0), 8), grass = ramp(f, v1(0.33), 8), head = pop(f, v1(0.66));

  // ── 表 ──
  const tableOn = ramp(f, va, 6) * (1 - ramp(f, vv0 + 4, 8));
  const topT = [at('va', 0.02), at('va', 0.5), at('vo', 0.02), at('vo', 0.5), at('veu', 0.02), at('veu', 0.62)];
  const botT = [0.48, 0.58, 0.68, 0.78].map((x) => at('vy', x));

  return (
    <AbsoluteFill>
      <Svg>
        <g opacity={partsOn}>
          {/* 天: まるい点 */}
          <g opacity={ray}>
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i / 8) * Math.PI * 2 + f * 0.02;
              return <line key={i} x1={450 + Math.cos(a) * 58} y1={430 + Math.sin(a) * 58} x2={450 + Math.cos(a) * 84} y2={430 + Math.sin(a) * 84} stroke={C.add} strokeWidth={9} strokeLinecap="round" />;
            })}
          </g>
          <circle cx={450} cy={430} r={36 * pop(f, at('v0', 0.45))} fill={C.vowel} />
          {/* 地: たいらな棒 */}
          <Ink strokes={[[[660, 430], [920, 430]]]} color={C.vowel} width={26} progress={ramp(f, at('v0', 0.55), 8)} />
          <g opacity={grass}>
            {Array.from({ length: 7 }, (_, i) => (
              <line key={i} x1={672 + i * 40} y1={462} x2={652 + i * 40} y2={490} stroke="#A08C6E" strokeWidth={6} strokeLinecap="round" />
            ))}
          </g>
          {/* 人: 立っている棒 */}
          <Ink strokes={[[[1130, 320], [1130, 560]]]} color={C.vowel} width={26} progress={ramp(f, at('v0', 0.65), 8)} />
          <circle cx={1130} cy={280} r={24 * head} fill="none" stroke={C.vowel} strokeWidth={9} />
          {[['天', 'まるい', 450, v1(0)], ['地', 'たいら', 790, v1(0.33)], ['人', '立つ', 1130, v1(0.66)]].map(([k, s, x, t]) => (
            <g key={k} opacity={ramp(f, t, 8)}>
              <Text x={x} y={665} size={100} font={FONT.pop} color={C.ink} outline="#fff">{k}</Text>
              <Text x={x} y={755} size={40} font={FONT.pop} color={C.sub}>{s}</Text>
            </g>
          ))}
        </g>

        <g opacity={tableOn}>
          {TOP.map(([ch, kana, rom], i) =>
            f < topT[i] ? null : (
              <g key={ch}>
                <VowelBuild f={f} ch={ch} cx={XS[i]} cy={Y1} size={SIZE} T={topT[i]} />
                <g opacity={ramp(f, topT[i] + 16, 8)}>
                  <Text x={XS[i]} y={Y1 + 110} size={56} font={FONT.pop} color={C.ink}>{kana}</Text>
                  <Text x={XS[i]} y={Y1 + 158} size={28} font={FONT.sans} weight={700} color={C.sub}>{rom}</Text>
                </g>
              </g>
            ),
          )}
          {BOT.map(([ch, kana, rom], i) =>
            f < botT[i] ? null : (
              <g key={ch}>
                <VowelBuild f={f} ch={ch} cx={XS[i]} cy={Y2} size={SIZE} T={botT[i]} />
                <g opacity={ramp(f, botT[i] + 16, 8)}>
                  <Text x={XS[i]} y={Y2 + 110} size={56} font={FONT.pop} color={C.ink}>{kana}</Text>
                  <Text x={XS[i]} y={Y2 + 158} size={28} font={FONT.sans} weight={700} color={C.sub}>{rom}</Text>
                </g>
              </g>
            ),
          )}
          {/* オが2つ: 口の形で区別 */}
          {[1, 2].map((i) => (
            <rect key={i} x={XS[i] - 92} y={Y1 - 100} width={184} height={290} rx={22} fill="none" stroke={C.add} strokeWidth={6}
              opacity={life(f, at('voo') + 4, at('veu'))} />
          ))}
          <Mouth x={XS[1]} y={Y1 + 235} kind="open" label="大きく" opacity={life(f, at('voo', 0.35), at('vy'))} />
          <Mouth x={XS[2]} y={Y1 + 235} kind="round" label="すぼめる" opacity={life(f, at('voo', 0.7), at('vy'))} />
          <Mouth x={XS[4]} y={Y1 + 235} kind="wide" label="横に引く" opacity={ramp(f, at('veu', 0.3), 8)} />
          <Text x={XS[0] + 315} y={Y2 - 128} size={34} font={FONT.pop} color={C.add} opacity={ramp(f, at('vy', 0.1), 8)}>点が2つ → ヤ行</Text>
        </g>

        {/* 足し算 */}
        <Text x={785} y={450} size={110} font={FONT.pop} color={C.ink} outline="#fff" outlineWidth={18}
          opacity={life(f, vv0 + 2, at('vve'))} transform={`translate(785 450) scale(${pop(f, vv0 + 2)}) translate(-785 -450)`}>
          母音 <tspan fill={C.vowel}>＋</tspan> 母音
        </Text>
        {EQS.map(([a, b, ab, kana, id, frac], i) => {
          const T = at(id, frac);
          if (f < T) return null;
          const x0 = i % 2 === 0 ? 80 : 760;
          const y = [280, 500, 720][Math.floor(i / 2)];
          const sA = 120, sAB = 150;
          const A = jamoAt(a, x0 + 70, y, sA), B = jamoAt(b, x0 + 260, y, sA);
          const target = place(jamoStrokes(ab), x0 + 465 - sAB / 2, y - sAB / 2, sAB);
          const t = move(f, T + 12, 14);
          return (
            <g key={ab}>
              <Ink strokes={A} color={C.vowel} width={strokeW(sA)} opacity={0.35 + 0.65 * ramp(f, T, 6)} progress={ramp(f, T, 6)} />
              <Text x={x0 + 165} y={y} size={60} font={FONT.sans} weight={900} color={C.sub} opacity={ramp(f, T + 3, 6)}>＋</Text>
              <Ink strokes={B} color={C.vowel} width={strokeW(sA)} progress={ramp(f, T + 4, 6)} />
              <Text x={x0 + 360} y={y} size={60} font={FONT.sans} weight={900} color={C.sub} opacity={ramp(f, T + 12, 6)}>＝</Text>
              {f >= T + 12 ? <Ink strokes={lerpStrokes([...A, ...B], target, t)} color={C.vowel} width={lerp(strokeW(sA), strokeW(sAB), t)} /> : null}
              <Text x={x0 + 545} y={y} size={70} font={FONT.pop} color={C.vowel} anchor="start" opacity={ramp(f, T + 24, 8)}>{kana}</Text>
            </g>
          );
        })}
        <g opacity={ramp(f, at('vvi', 0.55), 10)}>
          <Text x={80} y={850} size={36} font={FONT.pop} color={C.sub} anchor="start">ほかも：</Text>
          {REST.map(([ch, kana], i) => (
            <g key={ch}>
              <Ink strokes={jamoAt(ch, 330 + i * 235, 850, 64)} color={C.vowel} width={strokeW(64)} />
              <Text x={374 + i * 235} y={850} size={36} font={FONT.pop} color={C.ink} anchor="start">{kana}</Text>
            </g>
          ))}
        </g>
      </Svg>
      {[...topT, ...botT].map((T, i) => (
        <SE key={i} at={T + 7} name="pop" volume={0.22} />
      ))}
      {EQS.map(([, , , , id, frac], i) => (
        <SE key={`e${i}`} at={at(id, frac) + 22} name="pop" volume={0.28} />
      ))}
    </AbsoluteFill>
  );
};
