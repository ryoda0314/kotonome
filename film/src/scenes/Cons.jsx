import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, FONT } from '../theme';
import { lerp, life, move, pop, ramp } from '../anim';
import { lerpStrokes } from '../jamo';
import { Ink, Text } from '../components/Ink';
import { jamoAt, strokeW } from '../components/Hangul';
import { FaceFront, SideMouth, faceOverlay, sideOverlay, sideToScreen } from '../components/Diagrams';
import { SE, Svg, makeCue } from './common';

// 左にレンズ（断面図／正面の顔）、右上に5つの枠。
// 字は「図の上の赤い線 → 右の大きな字 → 枠」と同じ点のまま移動する。
const LENS = { cx: 420, cy: 530, r: 285 };
const BIG = { cx: 1110, cy: 650, size: 260 };
const SLOT = { y: 255, size: 104, xs: [860, 1010, 1160, 1310, 1455] };
const END = { y: 450, size: 180, xs: [305, 545, 785, 1025, 1265] };

const LETTERS = [
  { ch: 'ㄱ', view: 'side', kana: 'カ行', rom: 'k', note: '舌の奥' },
  { ch: 'ㄴ', view: 'side', kana: 'ナ行', rom: 'n', note: '舌の先' },
  { ch: 'ㅁ', view: 'face', kana: 'マ行', rom: 'm', note: '閉じた口' },
  { ch: 'ㅅ', view: 'face', kana: 'サ行', rom: 's', note: 'とがった歯' },
  { ch: 'ㅇ', view: 'side', kana: '音なし', rom: '—', note: 'のど' },
];

export const Cons = ({ cues }) => {
  const f = useCurrentFrame();
  const { at } = makeCue(cues);
  const c9 = at('c9');

  // 各字の「描く・大きく見せる・枠へ」の時刻
  const T = [
    { draw: at('cg2') + 3, big: at('cg2') + 22, slot: at('cn1') },
    { draw: at('cn2') + 2, big: at('cn2') + 20, slot: at('cm') },
    { draw: at('cm', 0.55), big: at('cm', 0.55) + 18, slot: at('cs') },
    { draw: at('cs', 0.62), big: at('cs', 0.62) + 18, slot: at('co') },
    { draw: at('co', 0.5), big: at('co', 0.5) + 18, slot: c9 },
  ];

  // レンズの中身: 断面図 → 正面の顔（ㅁ ㅅ）→ 断面図（ㅇ）
  const faceOn = ramp(f, at('cm'), 8) - ramp(f, at('co'), 8);
  const lensOn = pop(f, at('c0') + 2) * (1 - ramp(f, c9, 10));
  let from = 'rest', to = 'rest', t = 0;
  if (f >= at('co')) [from, to, t] = ['n', 'rest', move(f, at('co'), 10)];
  else if (f >= at('cn1') + 4) [from, to, t] = ['k', 'n', move(f, at('cn1') + 4, 14)];
  else [from, to, t] = ['rest', 'k', move(f, at('cg1') + 10, 14)];

  // 舌が触れる場所に脈打つ輪
  const contact = (pt, a, b) => {
    const k = life(f, a, b);
    if (k <= 0) return null;
    const [[x, y]] = sideToScreen([[pt]], LENS.cx, LENS.cy, LENS.r)[0];
    const pulse = ((f - a) % 24) / 24;
    return (
      <g opacity={k}>
        <circle cx={x} cy={y} r={14 + pulse * 26} fill="none" stroke={C.add} strokeWidth={6} opacity={1 - pulse} />
        <circle cx={x} cy={y} r={10} fill={C.add} />
      </g>
    );
  };

  const labels = [
    ['「カキクケコ」', at('cg1'), at('cn1')],
    ['「ナニヌネノ」', at('cn1'), at('cm')],
    ['「マミムメモ」', at('cm'), at('cs')],
    ['「サシスセソ」', at('cs'), at('co')],
    ['のど', at('co'), c9],
  ];

  return (
    <AbsoluteFill>
      <Svg>
        {/* 5つの枠 */}
        {SLOT.xs.map((x, i) => {
          const k = pop(f, at('c0') + 6 + i * 3) * (1 - ramp(f, c9, 8));
          const s = SLOT.size + 24;
          return (
            <g key={i} opacity={k}>
              <rect x={x - s / 2} y={SLOT.y - s / 2} width={s} height={s} rx={20} fill="#FFFFFF" stroke={C.faint} strokeWidth={4} strokeDasharray="12 10" />
              <Text x={x} y={SLOT.y + 92} size={32} font={FONT.pop} color={C.sub} opacity={ramp(f, T[i].slot + 10, 8)}>
                {LETTERS[i].kana}
              </Text>
            </g>
          );
        })}

        {/* レンズ */}
        <g transform={`translate(${LENS.cx} ${LENS.cy}) scale(${lensOn}) translate(${-LENS.cx} ${-LENS.cy})`} opacity={Math.min(1, lensOn * 1.5)}>
          <SideMouth cx={LENS.cx} cy={LENS.cy} r={LENS.r} from={from} to={to} t={t} opacity={1 - faceOn}>
            {contact([395, 246], at('cg1') + 22, at('cg2') + 6)}
            {contact([168, 260], at('cn1') + 16, at('cn2') + 4)}
          </SideMouth>
          {faceOn > 0 ? <FaceFront cx={LENS.cx} cy={LENS.cy} r={LENS.r} mouth={f < at('cs') ? 'closed' : 'teeth'} opacity={faceOn} /> : null}
        </g>

        {/* 何の音か */}
        {labels.map(([text, a, b]) => (
          <Text key={text} x={BIG.cx} y={430} size={70} font={FONT.pop} color={C.vowel} outline="#fff" outlineWidth={14} opacity={life(f, a + 4, b)}>
            {text}
          </Text>
        ))}

        {/* 字 */}
        {LETTERS.map((L, i) => {
          if (f < T[i].draw) return null;
          const overlay = L.view === 'side' ? sideOverlay(L.ch, LENS.cx, LENS.cy, LENS.r) : faceOverlay(L.ch, LENS.cx, LENS.cy, LENS.r / 300);
          const big = jamoAt(L.ch, BIG.cx, BIG.cy, BIG.size);
          const slot = jamoAt(L.ch, SLOT.xs[i], SLOT.y, SLOT.size);
          const end = jamoAt(L.ch, END.xs[i], END.y, END.size);
          const t1 = move(f, T[i].big, 14), t2 = move(f, T[i].slot, 14), t3 = move(f, c9 + i * 2, 16);
          const st = lerpStrokes(lerpStrokes(lerpStrokes(overlay, big, t1), slot, t2), end, t3);
          const w = lerp(lerp(lerp(15, strokeW(BIG.size), t1), strokeW(SLOT.size), t2), strokeW(END.size), t3);
          return <Ink key={L.ch} strokes={st} color={C.cons} width={w} outline="#FFFFFF" progress={ramp(f, T[i].draw, 12)} />;
        })}

        {/* まとめ: 5つ並べて、どこの形かを添える */}
        {LETTERS.map((L, i) => (
          <g key={L.ch} opacity={ramp(f, c9 + 12 + i * 3, 8)}>
            <Text x={END.xs[i]} y={END.y + 140} size={48} font={FONT.pop} color={C.ink} outline="#fff">{L.note}</Text>
            <Text x={END.xs[i]} y={END.y + 200} size={34} font={FONT.sans} weight={800} color={C.sub}>{`${L.kana}  ${L.rom}`}</Text>
          </g>
        ))}
      </Svg>
      {T.map((x, i) => (
        <SE key={i} at={x.slot + 10} name="pop" volume={0.3} />
      ))}
      <SE at={at('cg2') + 3} name="pop" volume={0.2} />
    </AbsoluteFill>
  );
};
