import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { clipId } from "../../src/lib/hangul.ts";
import { prog } from "./anim";
import { End } from "./scenes/End";
import { Hook } from "./scenes/Hook";
import { NameMark } from "./scenes/Mark";
import { Quote } from "./scenes/Quote";
import { Story } from "./scenes/Story";
import { C, FONT, useFonts } from "./theme";
import { CLIP_AT, READ, READ_STEP, T, TOTAL, TYPE, VOICE_AT } from "./timeline";

/** `from` から `to`（コマ）まで見せる。両端は `fade` コマで薄れる。 */
function Window({
  frame,
  from,
  to,
  fade = 12,
  fadeIn = true,
  fadeOut = true,
  children,
}: {
  frame: number;
  from: number;
  to: number;
  fade?: number;
  fadeIn?: boolean;
  fadeOut?: boolean;
  children: React.ReactNode;
}) {
  if (frame < from || frame >= to) return null;
  const opacity = Math.min(fadeIn ? prog(frame, from, fade) : 1, fadeOut ? 1 - prog(frame, to - fade, fade) : 1);
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
}

/** 映像。 */
export function Promo() {
  useFonts();
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.paper, color: C.ink, fontFamily: FONT.ui, WebkitFontSmoothing: "antialiased" }}>
      <style>{"* { box-sizing: border-box; }"}</style>
      <Window frame={frame} from={0} to={T.quote.start + 8} fadeIn={false} fade={14}>
        <Hook frame={frame} />
      </Window>
      <Window frame={frame} from={T.quote.start} to={T.title.start + 8} fade={14}>
        <Quote frame={frame} />
      </Window>
      <Window frame={frame} from={T.title.start} to={T.lesson.start + 10} fade={14}>
        <NameMark frame={frame} icon={T.title.icon} word={T.title.word} lead={T.title.lead} size={280} top={150} wordSize={104} leadSize={46} />
      </Window>
      <Window frame={frame} from={T.lesson.start} to={T.end.start + 10} fade={14}>
        <Story frame={frame} />
      </Window>
      <Window frame={frame} from={T.end.start} to={TOTAL} fade={20} fadeOut={false}>
        <End frame={frame} />
      </Window>
      <Sound />
    </AbsoluteFill>
  );
}

// ---- 音：ナレーション（scripts/voice.mjs）、アプリの声（public/app）、静かな音楽と小さな音（scripts/music.py） -------

const MUSIC = 0.5;
/** 声のあいだ、音楽をどれだけ下げるか（0〜1）。 */
const DUCK = 0.5;

/** 声（ナレーション・アプリの声）が鳴っている所。音楽はここで下がる。 */
const SPEAKING = [...VOICE_AT, ...CLIP_AT];

/** 音楽を下げる度合い（コマごと、0〜1）。声の 4 コマ前から下げはじめ、声が消えてから、ゆっくり戻す。 */
const DUCKING: number[] = (() => {
  const want = new Float32Array(TOTAL);
  for (const v of SPEAKING) for (let i = Math.max(0, v.from - 4); i < Math.min(TOTAL, v.until + 2); i++) want[i] = 1;
  const out: number[] = [];
  let level = 0;
  for (let i = 0; i < TOTAL; i++) {
    level += (want[i] - level) * (want[i] > level ? 0.25 : 0.07);
    out.push(level);
  }
  return out;
})();

function Clip({ from, src, volume = 1, frames }: { from: number; src: string; volume?: number; frames?: number }) {
  return (
    <Sequence from={from} durationInFrames={frames} layout="none">
      <Audio src={staticFile(src)} volume={volume} />
    </Sequence>
  );
}

function Sound() {
  const h = T.hook;
  const r = T.rain;
  const ty = T.type;
  const musicVolume = (frame: number) =>
    MUSIC * interpolate(frame, [0, 20, TOTAL - 75, TOTAL - 4], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * (1 - DUCK * (DUCKING[frame] ?? 0));
  // 語が降るときの雨粒：雨の6語。
  const rainDrops = [0, 4, 7, 11, 14, 18].map((d) => r.fall + d);
  // 十六字で読める語：書かれるたびに、小さな雫。
  const readDrops = READ.map((_, i) => h.read0 + Math.round(i * READ_STEP * 30) - 6);
  const taps = [r.press, r.chip];
  // 打ってみる：キーを押すたびに小さな音。
  const keys = TYPE.presses.map((p) => ty.type + p.at);
  return (
    <>
      <Audio src={staticFile("sound/music.wav")} volume={musicVolume} />
      {VOICE_AT.map((v) => (
        <Clip key={v.id} from={v.from} src={`voice/${v.id}.wav`} />
      ))}
      {CLIP_AT.map((c) => (
        <Clip key={`${c.text}${c.from}`} from={c.from} src={`app/clips/${clipId(c.text)}.wav`} />
      ))}
      {readDrops.map((at, i) => (
        <Clip key={`w${at}`} from={at} src={`sound/drop${(i % 3) + 1}.wav`} volume={0.18} />
      ))}
      {rainDrops.map((at, i) => (
        <Clip key={`r${at}`} from={at} src={`sound/drop${(i % 3) + 1}.wav`} volume={0.16} />
      ))}
      {[0, 4, 7].map((delay, i) => (
        <Clip key={`t${delay}`} from={T.title.icon + delay + 8} src={`sound/drop${i + 1}.wav`} volume={0.28} />
      ))}
      {[0, 4, 7].map((delay, i) => (
        <Clip key={`e${delay}`} from={T.end.icon + delay + 8} src={`sound/drop${i + 1}.wav`} volume={0.24} />
      ))}
      {taps.map((at) => (
        <Clip key={`p${at}`} from={at - 2} src="sound/tap.wav" volume={0.5} />
      ))}
      {keys.map((at) => (
        <Clip key={`k${at}`} from={at - 1} src="sound/tap.wav" volume={0.32} />
      ))}
      <Clip from={T.quote.lit + 4} src="sound/chime.wav" volume={0.26} />
      <Clip from={ty.done + 2} src="sound/chime.wav" volume={0.24} />
    </>
  );
}
