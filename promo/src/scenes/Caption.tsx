// 映像の言葉。アプリの画面の左に：いまどこか（見出し）、短い一文、その下の静かな一文。
// 時が来ると降ってきて、前のものは上がって消える。
import { fall, leave, mixColor, prog } from "../anim";
import { C, FONT } from "../theme";
import { Icon, type IconName } from "../ui";

export const CAP = { left: 120, width: 700, kickerTop: 300, mainTop: 372 };
// 見出し：いまどのタブか（アイコンと名前）。
export const KICKER = { icon: { left: CAP.left, top: 301, size: 34 }, text: { left: CAP.left + 46, top: 300, size: 30 } };

/** 一切れ：ただの字か、色や字体を変えた字（韓国語）。`at`：その字に色が付くコマ（無ければ一文が降りたとき）。 */
export type Part = string | { text: string; color?: string; font?: "ko"; at?: number };
/** いまどこか：最初の16字、雨の四つの所、また出会う、次の字。 */
export type Door = "first" | "rain" | "notice" | "type" | "lines" | "again" | "next";
export const DOOR_NAME: Record<Door, string> = {
  first: "最初の16字",
  rain: "浴びる",
  notice: "気づく",
  type: "打ってみる",
  lines: "文の中で",
  again: "また出会う",
  next: "次の字",
};
const DOOR_ICON: Record<Door, IconName> = { first: "sprout", rain: "rain", notice: "eye", type: "keys", lines: "lines", again: "rain", next: "sprout" };
const doorColor = (door: Door) => (door === "again" ? C.again : C.accent);
/** `subAt`：静かな一文が降る時（ふだんは本文のすぐあと）。 */
export type Cap = { from: number; door: Door; main: Part[][]; sub?: Part[][]; subAt?: number };

export function Kicker({ door, style }: { door: Door; style?: React.CSSProperties }) {
  return (
    <>
      <span style={{ position: "absolute", left: KICKER.icon.left, top: KICKER.icon.top, color: doorColor(door), ...style }}>
        <Icon name={DOOR_ICON[door]} size={KICKER.icon.size} stroke={1.7} />
      </span>
      <span
        style={{
          position: "absolute",
          left: KICKER.text.left,
          top: KICKER.text.top,
          fontSize: KICKER.text.size,
          lineHeight: "36px",
          fontWeight: 600,
          color: doorColor(door),
          fontFamily: FONT.ja,
          whiteSpace: "nowrap",
          ...style,
        }}
      >
        {DOOR_NAME[door]}
      </span>
    </>
  );
}

function Parts({ parts, frame, colorAt }: { parts: Part[]; frame: number; colorAt: number }) {
  return (
    <>
      {parts.map((part, k) => {
        if (typeof part === "string") return <span key={k}>{part}</span>;
        const family = part.font === "ko" ? FONT.ko : undefined;
        return (
          <span
            key={k}
            style={{
              fontFamily: family,
              fontWeight: part.color ? 600 : undefined,
              color: part.color ? mixColor(C.ink2, part.color, prog(frame, part.at ?? colorAt, 14)) : undefined,
            }}
          >
            {part.text}
          </span>
        );
      })}
    </>
  );
}

/** 一続きの言葉。`from` コマから、次が来るまで。 */
export function Captions({ frame, caps, until }: { frame: number; caps: Cap[]; until: number }) {
  return (
    <>
      {caps.map((c, i) => {
        const next = caps[i + 1]?.from ?? until;
        if (frame < c.from || frame > next + 14) return null;
        const prevDoor = caps[i - 1]?.door;
        const nextDoor = caps[i + 1]?.door;
        // 前の一文が消えて（9 コマ）から、次が降る。二つの文が重ならないように。
        const style = frame >= next ? leave(frame, next, 9, 12) : fall(frame, c.from + 8, 16, 16);
        // 見出しは、同じタブの間は残り、タブが変わると入れ替わる。
        const kickerIn = prevDoor === c.door ? { opacity: 1 } : fall(frame, c.from + 8, 10, 12);
        const kickerOut = nextDoor === c.door || !caps[i + 1] ? null : leave(frame, next, 8, 8);
        const kick = frame >= next && kickerOut ? kickerOut : frame >= next ? { opacity: 0 } : kickerIn;
        const subAt = c.subAt ?? c.from + 16;
        return (
          <div key={c.from}>
            <Kicker door={c.door} style={kick} />
            <div style={{ position: "absolute", left: CAP.left, top: CAP.mainTop, width: CAP.width, ...style }}>
              {c.main.map((m, j) => (
                <p key={j} style={{ margin: 0, fontSize: 52, fontWeight: 600, lineHeight: 1.42, letterSpacing: "0.01em", color: C.ink, fontFamily: FONT.ui }}>
                  <Parts parts={m} frame={frame} colorAt={c.from + 8} />
                </p>
              ))}
              {c.sub ? (
                <div style={{ marginTop: 30, ...fall(frame, subAt, 10, 16) }}>
                  {c.sub.map((line, j) => (
                    <p key={j} style={{ margin: 0, fontSize: 27, lineHeight: 1.75, color: C.ink2, fontFamily: FONT.ui }}>
                      <Parts parts={line} frame={frame} colorAt={subAt + 8} />
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </>
  );
}
