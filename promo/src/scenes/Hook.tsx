// A. 問いとしくみ：はじめの一コマから、大きな ㄱ と「この字、何の形？」。字が口の絵の舌へ降りて重なり、「カキクケコ」の
// 舌の形。口の絵は左へ寄り、右に ㄴ：「ナニヌネノ」なら、この形。子音は口の形の絵（五つ）。同じ場所で線を一本足すと
// 別の音（ㄴ→ㄷ・ㅇ→ㅎ・ㅁ→ㅂ・ㅅ→ㅈ、나→다）。母音は六つ（音といっしょに）。組むと一つの音（ㄴ ㅏ ㅁ ㅜ → 나무、木）。
// 十六字で、もう読める（라디오・바나나・드라마）。
import { f, fall, leave, mix, prog, SOFT } from "../anim";
import { JoinWord, Letter, Word } from "../glyph";
import { MouthPicture, type MouthLetter } from "../mouth";
import { READ, READ_STEP, sounding, T, VOWEL_STEP, VOWELS } from "../timeline";
import { C, FONT } from "../theme";
import { Icon } from "../ui";

/** 子音五つと口の場所。同じ場所で線を一本足した字。 */
const FIVE: [MouthLetter, string, string | null][] = [
  ["ㄱ", "舌の奥", null],
  ["ㄴ", "舌の先", "ㄷ"],
  ["ㅇ", "のど", "ㅎ"],
  ["ㅁ", "口", "ㅂ"],
  ["ㅅ", "歯", "ㅈ"],
];
const LETTER = 170;
/** 口の絵：はじめは一つ（真ん中）、ㄴ が来ると左右に二つ。 */
const LENS = 560;
const LENS_TOP = 110;
const ONE = (1920 - LENS) / 2;
const PAIR = [330, 1030];

const caption = { position: "absolute", left: 0, right: 0, margin: 0, textAlign: "center", fontFamily: FONT.ui, fontWeight: 600, color: C.ink } as const;
const row = { position: "absolute", left: 0, right: 0, display: "flex", justifyContent: "center" } as const;

/** `from` から `to` まで：降りてきて（`enter` が false なら、はじめから在る）、次が来ると上がって消える。 */
function Part({ frame, from, to, enter = true, children }: { frame: number; from: number; to: number; enter?: boolean; children: React.ReactNode }) {
  if (frame < from || frame >= to + 12) return null;
  return <div style={frame >= to ? leave(frame, to, 12) : enter ? fall(frame, from, 16, 16) : undefined}>{children}</div>;
}

export function Hook({ frame }: { frame: number }) {
  const h = T.hook;
  return (
    <>
      {/* この字、何の形？ → 「カキクケコ」の舌の形 → 「ナニヌネノ」なら、この形 */}
      <Part frame={frame} from={h.start} to={h.five} enter={false}>
        <div style={{ position: "absolute", left: mix(ONE, PAIR[0], prog(frame, h.second, 21, SOFT)), top: LENS_TOP, width: LENS, height: LENS }}>
          <MouthPicture ch="ㄱ" pose={prog(frame, h.reveal, 18)} write={1} lift={1 - prog(frame, h.reveal + 3, 24)} />
        </div>
        {frame >= h.second ? (
          <div style={{ position: "absolute", left: PAIR[1], top: LENS_TOP, width: LENS, height: LENS, ...fall(frame, h.second + 6, 16, 16) }}>
            <MouthPicture ch="ㄴ" pose={prog(frame, h.land, 18)} write={1} lift={1 - prog(frame, h.land + 3, 24)} />
          </div>
        ) : null}
        {frame < h.answer + 12 ? <p style={{ ...caption, top: 730, fontSize: 76, ...(frame >= h.reveal ? leave(frame, h.reveal, 12) : {}) }}>この字、何の形？</p> : null}
        {frame >= h.answer && frame < h.second + 12 ? (
          <p style={{ ...caption, top: 740, fontSize: 56, ...(frame >= h.second ? leave(frame, h.second, 12) : fall(frame, h.answer, 14, 16)) }}>
            「カキクケコ」と言うときの、舌の形。
          </p>
        ) : null}
        {frame >= h.second ? (
          <>
            <p style={{ ...caption, left: PAIR[0], right: "auto", width: LENS, top: 720, fontSize: 48, ...fall(frame, h.second + 10, 12, 14) }}>「カキクケコ」</p>
            <p style={{ ...caption, left: PAIR[1], right: "auto", width: LENS, top: 720, fontSize: 48, ...fall(frame, h.land, 12, 14) }}>「ナニヌネノ」</p>
          </>
        ) : null}
      </Part>

      {/* 子音は、口の形の絵。同じ場所で線を一本足すと、別の音 */}
      <Part frame={frame} from={h.five} to={h.vowels}>
        <div style={{ ...row, top: 120, gap: 80 }}>
          {FIVE.map(([ch, place, grown], i) => {
            // 나 → 다 が鳴るあいだ、その字が灯る。
            const na = sounding(frame, "나") >= 0 && ch === "ㄴ";
            const da = sounding(frame, "다") >= 0 && grown === "ㄷ";
            return (
              <div key={ch} style={{ width: LETTER, display: "flex", flexDirection: "column", alignItems: "center", ...fall(frame, h.five + i * 5, 16, 14) }}>
                <Letter ch={ch} size={LETTER} write={prog(frame, h.five + i * 5, 18)} color={na ? C.accent : undefined} />
                <span style={{ marginTop: 10, fontSize: 32, color: C.muted, fontFamily: FONT.ja }}>{place}</span>
                {grown ? (
                  <div style={{ marginTop: 26, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, ...fall(frame, h.grown + i * 4, 12, 14) }}>
                    <span style={{ display: "inline-flex", transform: "rotate(90deg)", color: C.faint }}>
                      <Icon name="arrow" size={34} stroke={1.8} />
                    </span>
                    <Letter ch={grown} size={LETTER} grow={prog(frame, h.grown + i * 4 + 4, 16)} color={da ? C.accent : undefined} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        <p style={{ ...caption, top: 720, fontSize: 60, ...(frame < h.grow ? fall(frame, h.five + 14, 14, 16) : leave(frame, h.grow, 10)) }}>子音は、口の形の絵。</p>
        {frame >= h.grow ? <p style={{ ...caption, top: 720, fontSize: 60, ...fall(frame, h.grow + 8, 14, 16) }}>同じ場所で、線を一本足すと、別の音。</p> : null}
      </Part>

      {/* 母音は、六つ */}
      <Part frame={frame} from={h.vowels} to={h.join}>
        <div style={{ ...row, top: 260, gap: 50 }}>
          {VOWELS.map((ch, i) => {
            const at = h.vowel0 + f(i * VOWEL_STEP);
            return (
              <div key={ch} style={fall(frame, at - 4, 14, 12)}>
                <Letter ch={ch} size={LETTER} write={prog(frame, at - 4, 12)} />
              </div>
            );
          })}
        </div>
        <p style={{ ...caption, top: 720, fontSize: 60, ...fall(frame, h.vowels + 8, 14, 16) }}>母音は、六つ。</p>
      </Part>

      {/* 組むと、一つの音：나무 */}
      <Part frame={frame} from={h.join} to={h.read}>
        <div style={{ ...row, top: 200 }}>
          <JoinWord text="나무" p={prog(frame, h.joined, 27)} height={260} />
        </div>
        <p style={{ ...caption, top: 520, fontSize: 52, fontWeight: 500, color: C.ink2, ...fall(frame, h.tree, 12, 14) }}>木</p>
        <p style={{ ...caption, top: 720, fontSize: 60, ...fall(frame, h.join + 8, 14, 16) }}>組み合わせると、ひとつの音。</p>
      </Part>

      {/* 十六字で、もう読める */}
      <Part frame={frame} from={h.read} to={h.end}>
        <div style={{ ...row, top: 250, gap: 70 }}>
          {READ.map(([ko, ja], i) => {
            const at = h.read0 + f(i * READ_STEP);
            return (
              <div key={ko} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26, ...fall(frame, at - 6, 14, 12) }}>
                <Word text={ko} height={150} write={prog(frame, at - 6, 16)} />
                <span style={{ fontSize: 40, color: C.ink2, fontFamily: FONT.ja, ...fall(frame, at + 8, 10, 12) }}>{ja}</span>
              </div>
            );
          })}
        </div>
        <p style={{ ...caption, top: 720, fontSize: 64, ...fall(frame, h.read + 8, 14, 16) }}>
          <span style={{ color: C.accent }}>16字</span>で、もう読める。
        </p>
      </Part>
    </>
  );
}
