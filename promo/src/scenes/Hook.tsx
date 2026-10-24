// A. 問い：ハングルが記号に見える。「カキクケコ」の舌の形が ㄱ（口の絵から字を取り出す）。子音は口の形の絵。
// 九十秒で、もう読める：字母が四角に組み上がって 라디오、ラジオ。
import { fall, leave, prog } from "../anim";
import { JoinWord, Letter, Word } from "../glyph";
import { MouthPicture, type MouthLetter } from "../mouth";
import { T } from "../timeline";
import { C, FONT } from "../theme";

/** 記号に見える語：ばらばらの場所に、少し傾いて降ってくる。 */
const SCATTER: [text: string, x: number, y: number, h: number, tilt: number][] = [
  ["라디오", 260, 170, 120, -4],
  ["바나나", 1180, 120, 104, 3],
  ["드라마", 760, 360, 132, 0],
  ["커피", 300, 560, 112, 5],
  ["김치", 1290, 520, 120, -3],
];
const FIVE: [MouthLetter, string][] = [
  ["ㄱ", "舌の奥"],
  ["ㄴ", "舌の先"],
  ["ㅇ", "のど"],
  ["ㅁ", "口"],
  ["ㅅ", "歯"],
];

const caption = { position: "absolute", left: 0, right: 0, margin: 0, textAlign: "center", fontFamily: FONT.ui, fontWeight: 600, color: C.ink } as const;

export function Hook({ frame }: { frame: number }) {
  const h = T.hook;
  return (
    <>
      {/* 記号に見える語 */}
      {frame < h.mouth + 12 ? (
        <div style={frame >= h.mouth ? leave(frame, h.mouth, 12) : undefined}>
          {SCATTER.map(([text, x, y, height, tilt], i) => (
            <div key={text} style={{ position: "absolute", left: x, top: y, transform: `rotate(${tilt}deg)` }}>
              <div style={fall(frame, h.words + i * 7, 26, 18)}>
                <Word text={text} height={height} ink color={C.ink2} />
              </div>
            </div>
          ))}
          <p style={{ ...caption, top: 830, fontSize: 56, ...fall(frame, h.words + 20, 14, 18) }}>ハングル、記号に見えていませんか？</p>
        </div>
      ) : null}

      {/* 「カキクケコ」の舌の形が、ㄱ */}
      {frame >= h.mouth && frame < h.five + 12 ? (
        <div style={frame >= h.five ? leave(frame, h.five, 12) : fall(frame, h.mouth, 16, 16)}>
          <div style={{ position: "absolute", left: 230, top: 150, width: 640, height: 640 }}>
            <MouthPicture
              ch="ㄱ"
              pose={prog(frame, h.pose, 21)}
              pulse={frame >= h.pose + 21 && frame < h.write ? ((frame - h.pose - 21) % 39) / 39 : undefined}
              write={prog(frame, h.write, 24)}
              lift={prog(frame, h.lift, 18)}
            />
          </div>
          <div style={{ position: "absolute", left: 990, top: 330, width: 780 }}>
            <p style={{ margin: 0, fontSize: 54, fontWeight: 600, lineHeight: 1.45, fontFamily: FONT.ui, ...fall(frame, h.mouth + 8, 14, 16) }}>
              「カキクケコ」と言うとき、
              <br />
              舌の奥が上がる。
            </p>
            <p style={{ margin: "34px 0 0", display: "flex", alignItems: "center", gap: 18, fontSize: 54, fontWeight: 600, fontFamily: FONT.ui, ...fall(frame, h.write, 14, 16) }}>
              その形が、
              <Letter ch="ㄱ" size={68} color={C.accent} />
              <span style={{ fontSize: 40, color: C.muted, fontWeight: 500 }}>（カ行）</span>
            </p>
          </div>
        </div>
      ) : null}

      {/* 子音は、口の形の絵 */}
      {frame >= h.five && frame < h.join + 12 ? (
        <div style={frame >= h.join ? leave(frame, h.join, 12) : undefined}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 260, display: "flex", justifyContent: "center", gap: 70 }}>
            {FIVE.map(([ch, place], i) => (
              <div key={ch} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, ...fall(frame, h.five + i * 5, 16, 14) }}>
                <Letter ch={ch} size={190} write={prog(frame, h.five + i * 5, 18)} />
                <span style={{ fontSize: 34, color: C.muted, fontFamily: FONT.ja }}>{place}</span>
              </div>
            ))}
          </div>
          <p style={{ ...caption, top: 720, fontSize: 60, ...fall(frame, h.five + 14, 14, 16) }}>子音は、口の形の絵。</p>
        </div>
      ) : null}

      {/* 九十秒で、もう読める：라디오 */}
      {frame >= h.join ? (
        <div style={fall(frame, h.join, 12, 14)}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 250, display: "flex", justifyContent: "center" }}>
            <JoinWord text="라디오" p={prog(frame, h.read - 14, 26)} height={230} />
          </div>
          <p style={{ ...caption, top: 560, fontSize: 48, fontWeight: 500, color: C.ink2, ...fall(frame, h.read + 12, 12, 14) }}>ラジオ</p>
          <p style={{ ...caption, top: 720, fontSize: 64, ...fall(frame, h.read + 30, 14, 16) }}>
            <span style={{ color: C.accent }}>90秒</span>で、もう読める。
          </p>
        </div>
      ) : null}
    </>
  );
}
