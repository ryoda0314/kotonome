// B. 答え合わせ：しくみを見たあとで、ハングルを世に出した本『訓民正音』（1446年、鄭麟趾の序）の一文が縦二行に（すばやく）。
// 訳が二行。「不終朝」（朝が終わらないうちに）が灯って、朝のうちに、読みはじめられる。はじめに見せると退屈なので、ここで。
import { fall, mixColor, prog } from "../anim";
import { T } from "../timeline";
import { C, FONT } from "../theme";

/** 右の行から：故智者不終朝而㑹 ／ 愚者可浹旬而學。 */
const LINES = ["故智者不終朝而㑹", "愚者可浹旬而學"];
/** 「不終朝」：右の行の 3〜5 字目。 */
const MORNING = new Set([3, 4, 5]);

const SIZE = 96;
const ADVANCE = 112;
/** 行の中心（右の行、左の行）と、上端。 */
const COLUMN_X = [1540, 1380];
const TOP = (1080 - LINES[0].length * ADVANCE) / 2;
const RULE = { top: TOP - 40, height: LINES[0].length * ADVANCE + 72 };

/** 二行の漢文と、行のあいだの罫線。`from`：一字目が降りるコマ（`step` コマおき）。`lit`：「不終朝」が灯るコマ。 */
function Columns({ frame, from, step = 4, lit }: { frame: number; from: number; step?: number; lit?: number }) {
  const rules = [COLUMN_X[0] + 80, (COLUMN_X[0] + COLUMN_X[1]) / 2, COLUMN_X[1] - 80];
  return (
    <>
      {rules.map((x) => (
        <span key={x} style={{ position: "absolute", left: x, top: RULE.top, width: 1.5, height: RULE.height, background: C.line2, opacity: prog(frame, from, 18) }} />
      ))}
      {LINES.map((line, col) => (
        <div key={line} style={{ position: "absolute", left: COLUMN_X[col] - SIZE / 2, top: TOP, width: SIZE, display: "flex", flexDirection: "column" }}>
          {[...line].map((ch, i) => {
            const n = col === 0 ? i : LINES[0].length + i;
            const on = col === 0 && MORNING.has(i) && lit !== undefined ? prog(frame, lit + (i - 3) * 3, 14) : 0;
            return (
              <span
                key={i}
                style={{
                  height: ADVANCE,
                  fontFamily: FONT.classic,
                  fontWeight: 700,
                  fontSize: SIZE,
                  lineHeight: `${ADVANCE}px`,
                  textAlign: "center",
                  color: on > 0 ? mixColor(C.ink, C.accent, on) : C.ink,
                  ...fall(frame, from + n * step, 14, 16),
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
      ))}
    </>
  );
}

const LEFT = { left: 190, width: 980 };
const line = { position: "absolute", left: LEFT.left, width: LEFT.width, margin: 0, fontFamily: FONT.ui, color: C.ink } as const;

export function Quote({ frame }: { frame: number }) {
  const q = T.quote;
  return (
    <>
      <Columns frame={frame} from={q.chars} step={1} lit={q.lit} />
      <p style={{ ...line, top: 300, fontSize: 30, color: C.muted, ...fall(frame, q.chars + 12, 10, 16) }}>
        『訓民正音』（1446年）、鄭麟趾の序より
      </p>
      <p style={{ ...line, top: 380, fontSize: 54, fontWeight: 600, lineHeight: 1.45, ...fall(frame, q.gloss1, 14, 16) }}>賢い者は、朝のうちにわかり、</p>
      <p style={{ ...line, top: 460, fontSize: 54, fontWeight: 600, lineHeight: 1.45, ...fall(frame, q.gloss2, 14, 16) }}>愚かな者でも、十日で学べる。</p>
      <p style={{ ...line, top: 640, fontSize: 64, fontWeight: 600, ...fall(frame, q.lit, 14, 16) }}>
        <span style={{ color: C.accent }}>朝のうちに</span>、読みはじめられる。
      </p>
    </>
  );
}
