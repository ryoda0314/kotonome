// 口の中の絵（アプリの ../src/components/Mouth.tsx と同じ絵）：ㄱ ㄴ ㅇ は頭を横に切った図、ㅁ ㅅ は正面の顔。
// 平らな色、一つの線の太さ、陰は付けない。舌はどの形でも点の数が同じ多角形なので、休みからカ行・ナ行へ点ごとに動く。
// アプリでは時間で動くところを、ここではコマで：`pose`（舌が動く）・`write`（字を書く）・`lift`（字が絵から離れる）。
import type { CSSProperties } from "react";
import { CONSONANTS, mapBox, toPath, type Box, type Pt, type Stroke } from "../../src/lib/glyph.ts";
import { C } from "./theme";

type Pose = "rest" | "k" | "n";
export type MouthLetter = "ㄱ" | "ㄴ" | "ㅁ" | "ㅅ" | "ㅇ";

const TONGUE: Record<Pose, Pt[]> = {
  rest: [[150, 326], [150, 310], [170, 297], [215, 284], [275, 277], [335, 280], [385, 296], [418, 328], [430, 370], [432, 410], [428, 446], [380, 460], [300, 450], [215, 406], [166, 356]],
  // カ行: the back of the tongue rises and shuts the way into the throat.
  k: [[150, 326], [152, 312], [172, 302], [215, 292], [268, 278], [322, 254], [372, 240], [414, 258], [432, 312], [434, 380], [428, 446], [380, 460], [300, 450], [215, 406], [166, 356]],
  // ナ行: the tip of the tongue touches the ridge behind the upper teeth.
  n: [[156, 318], [160, 266], [180, 254], [218, 268], [275, 279], [335, 281], [385, 296], [418, 328], [430, 370], [432, 410], [428, 446], [380, 460], [300, 450], [215, 406], [168, 354]],
};

/** Where each letter is written over the drawing: its own shape mapped into this box, so it is the letter, point for point. */
const OVER: Record<MouthLetter, Box> = {
  "ㄱ": [232, 214, 444, 398],
  "ㄴ": [136, 236, 356, 338],
  "ㅇ": [406, 420, 514, 528],
  "ㅁ": [214, 352, 386, 452],
  "ㅅ": [252, 330, 348, 470],
};
const VIEW = { x: 300, y: 330, r: 320 };
const LETTER_BOX: Box = [150, 180, 450, 480];
const CONTACT: Partial<Record<MouthLetter, Pt>> = { "ㄱ": [395, 246], "ㄴ": [168, 252] };
const SIDE_VIEW: ReadonlySet<MouthLetter> = new Set(["ㄱ", "ㄴ", "ㅇ"]);

const HEAD =
  "M720 -40 L720 700 L345 700 L345 640 C335 560 312 495 268 462 C228 448 182 446 155 425 C128 404 120 372 127 350 " +
  "C131 336 129 326 121 319 C106 312 102 298 112 291 L118 288 C103 282 101 268 112 260 C121 252 124 242 121 234 " +
  "C116 227 102 225 90 219 C70 211 66 191 82 178 C99 160 118 118 128 78 C134 46 140 16 150 -20 Z";
const CAVITY =
  "M116 289 L150 293 C164 264 194 242 240 233 C290 225 345 225 385 237 C405 243 420 253 428 268 " +
  "Q433 298 421 311 Q441 302 449 252 L456 214 C470 210 486 224 487 252 L490 680 L436 680 L430 440 " +
  "L380 452 L300 442 L218 398 L156 336 L148 300 Z";

function smoothClosed(pts: Pt[]): string {
  const n = pts.length;
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + "Z";
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => 1 - Math.pow(1 - t, 3);


const S: Record<string, CSSProperties> = {
  air: { fill: "#fff" },
  skin: { fill: C.skin, stroke: C.skinLine, strokeWidth: 4, strokeLinejoin: "round" },
  cavity: { fill: C.cavity },
  tongue: { fill: C.tongue, stroke: C.tongueLine, strokeWidth: 4 },
  tooth: { fill: "#fff", stroke: "#8a7a70", strokeWidth: 2.5, strokeLinejoin: "round" },
  line: { fill: "none", stroke: C.skinLine, strokeWidth: 3, strokeLinecap: "round" },
  brow: { fill: "none", stroke: "#3b3b3b", strokeWidth: 5, strokeLinecap: "round" },
  hair: { fill: "#4a3b32" },
  eye: { fill: "#2b2b2b" },
  lips: { fill: "#e86a7a", stroke: C.tongueLine, strokeWidth: 4 },
  lipLine: { fill: "none", stroke: C.tongueLine, strokeWidth: 5, strokeLinecap: "round" },
};

function SideView({ pose, t }: { pose: Pose; t: number }) {
  const k = ease(t);
  const tongue = TONGUE.rest.map((p, i): Pt => [lerp(p[0], TONGUE[pose][i][0], k), lerp(p[1], TONGUE[pose][i][1], k)]);
  return (
    <g>
      <path d={HEAD} style={S.skin} />
      <path d={CAVITY} style={S.cavity} />
      <path d="M140 259 L157 262 L155 293 L146 297 Z" style={S.tooth} />
      <path d="M146 301 L156 299 L158 328 L143 330 Z" style={S.tooth} />
      <path d={smoothClosed(tongue)} style={S.tongue} />
      <path d="M96 212 C108 208 118 210 124 214" style={S.line} />
      <path d="M150 60 C170 54 190 56 204 64" style={S.brow} />
    </g>
  );
}

function FrontView({ mouth }: { mouth: "closed" | "teeth" }) {
  const teeth = [214, 256, 300, 344, 386].map((x) => `M${x - 23} 468 L${x} ${x === 300 ? 372 : 414} L${x + 23} 468 Z`);
  return (
    <g>
      <rect x={-40} y={-20} width={700} height={720} style={S.air} />
      <ellipse cx={300} cy={318} rx={226} ry={238} style={S.skin} />
      <path
        d="M74 300 C64 140 170 64 300 64 C430 64 536 140 526 300 C512 236 470 190 410 176 C380 214 330 220 300 196 C262 226 200 222 176 180 C120 200 90 240 74 300 Z"
        style={S.hair}
      />
      <ellipse cx={212} cy={262} rx={16} ry={24} style={S.eye} />
      <ellipse cx={388} cy={262} rx={16} ry={24} style={S.eye} />
      {mouth === "closed" ? (
        <g>
          <rect x={214} y={352} width={172} height={100} rx={34} style={S.lips} />
          <path d="M226 402 L374 402" style={S.lipLine} />
        </g>
      ) : (
        <g>
          <path d="M180 352 C224 334 376 334 420 352 C428 430 384 488 300 488 C216 488 172 430 180 352 Z" style={S.cavity} />
          {teeth.map((d) => (
            <path key={d} d={d} style={S.tooth} />
          ))}
        </g>
      )}
    </g>
  );
}

/**
 * 一つの子音の絵。`pose`：舌が動いた度合い（0 → 1）。`write`：字が絵の上に書かれた度合い。`lift`：字が絵から離れて、
 * 字だけになる度合い。`pulse`：舌が触れる所の輪の位相（0 → 1、無ければ出さない）。
 */
export function MouthPicture({ ch, pose = 1, write = 0, lift = 0, pulse }: { ch: MouthLetter; pose?: number; write?: number; lift?: number; pulse?: number }) {
  const side = SIDE_VIEW.has(ch);
  const shape: Pose = ch === "ㄱ" ? "k" : ch === "ㄴ" ? "n" : "rest";
  const over: Stroke[] = mapBox(CONSONANTS[ch].strokes, OVER[ch]);
  const big: Stroke[] = mapBox(CONSONANTS[ch].strokes, LETTER_BOX);
  const k = ease(lift);
  const letter = over.map((st, i) => st.map((p, j): Pt => [lerp(p[0], big[i][j][0], k), lerp(p[1], big[i][j][1], k)]));
  const contact = CONTACT[ch];
  const vb = `${VIEW.x - VIEW.r} ${VIEW.y - VIEW.r} ${VIEW.r * 2} ${VIEW.r * 2}`;
  const n = letter.length;
  return (
    <svg viewBox={vb} style={{ display: "block", width: "100%", height: "100%" }}>
      <defs>
        <clipPath id={`lens-${ch}`}>
          <circle cx={VIEW.x} cy={VIEW.y} r={VIEW.r - 4} />
        </clipPath>
      </defs>
      <circle cx={VIEW.x} cy={VIEW.y} r={VIEW.r - 4} style={S.air} />
      <g clipPath={`url(#lens-${ch})`} style={{ opacity: 1 - 0.82 * k }}>
        {side ? <SideView pose={shape} t={pose} /> : <FrontView mouth={ch === "ㅁ" ? "closed" : "teeth"} />}
        {contact && pulse !== undefined && write <= 0 ? (
          <g>
            <circle cx={contact[0]} cy={contact[1]} r={14 * (1 + 2.2 * pulse)} style={{ fill: "none", stroke: C.accent, strokeWidth: 5, opacity: 0.9 * (1 - pulse) }} />
            <circle cx={contact[0]} cy={contact[1]} r={9} style={{ fill: C.accent }} />
          </g>
        ) : null}
      </g>
      <circle cx={VIEW.x} cy={VIEW.y} r={VIEW.r - 4} style={{ fill: "none", stroke: C.ink, strokeWidth: 6 }} />
      {write > 0 ? (
        <g style={{ fill: "none", stroke: C.accent, strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: lerp(16, 26, k) }}>
          {letter.map((st, i) => {
            const p = Math.max(0, Math.min(1, write * n - i));
            return p > 0 ? <path key={i} d={toPath(st)} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} /> : null;
          })}
        </g>
      ) : null}
    </svg>
  );
}
