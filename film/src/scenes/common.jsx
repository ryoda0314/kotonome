import React from 'react';
import { Audio, Sequence, staticFile } from 'remotion';

/**
 * 章の中のセリフを「章の頭からのフレーム」で引く道具。
 *   at('cg2')        … その行の始まり
 *   at('cg2', 0.5)   … その行の半分の時点（言葉の途中に合わせたいとき）
 *   end('cg2')       … その行の終わり（声が止まる瞬間）
 *   next('cg2')      … 次の行の始まり（考える時間の終わり）
 */
export const makeCue = (cues) => ({
  at: (id, frac = 0) => {
    const c = cues[id];
    if (!c) throw new Error(`cue が無い: ${id}`);
    return Math.round(c.from + c.dur * frac);
  },
  end: (id) => cues[id].from + cues[id].dur,
  next: (id) => cues[id].next,
});

/** 効果音を1発 */
export const SE = ({ at, name, volume = 0.35 }) =>
  at == null ? null : (
    <Sequence from={Math.max(0, Math.round(at))} durationInFrames={30} layout="none">
      <Audio src={staticFile(`se/${name}.wav`)} volume={volume} />
    </Sequence>
  );

export const Svg = ({ children }) => (
  <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
    {children}
  </svg>
);
