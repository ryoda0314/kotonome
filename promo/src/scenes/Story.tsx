// E. アプリで学べる：左に映像の言葉、右にアプリの画面。
//   最初の16字：ㅁ の口のページ（くちびるを閉じ、字が書かれ、絵から離れて 마）。いま見たしくみを、アプリでひとつずつ。
//   浴びる：6つの語が降る。카드 を押すと音と意味と字。知らない ㅋ を押すと、その場で字のシート。
//   打ってみる：카드 を두벌식で。ㅋ を ㄱ と打ち間違えて ⌫、打ち直す。打ち終えると 카드 が鳴る。
import type { CSSProperties, ReactNode } from "react";
import { guide, keysFor, typeKeys, textOf, composing, KEY_OF } from "../../../src/lib/dubeol.ts";
import { fall, keysAt, prog, rise, SOFT } from "../anim";
import { Letter, Word } from "../glyph";
import { MouthPicture } from "../mouth";
import { sounding, T, TYPE } from "../timeline";
import { C, FONT } from "../theme";
import { Bar, big, BottomNav, Caret, Icon, KeyMap, Keyboard, lead, Press, RAIN_STEPS, Speak, text, Track } from "../ui";
import { Captions, type Cap } from "./Caption";

/** 映像の言葉。 */
const CAPS: Cap[] = [
  { from: T.lesson.cap, door: "first", main: [["最初の16字は、"], ["アプリでひとつずつ。"]], sub: [["口の形から、声といっしょに。"], ["少し見たら、すぐ何度も思い出す。"]] },
  { from: T.rain.cap, door: "rain", main: [["音つきの語が、"], ["雨のように降ってくる。"]], sub: [["読んでから押すと、音と意味。"]] },
  { from: T.rain.cap2, door: "rain", main: [["知らない字は、"], ["押せばその場で。"]], sub: [["音と形と、キーボードの場所。"]] },
  {
    from: T.type.cap,
    door: "type",
    main: [["聞いた語を、"], ["自分の指で打つ。"]],
    sub: [["スマホやパソコンと同じ、ふつうの韓国語キーボード。"], ["次のキーが光る。打ち間違えたら、⌫ で戻る。"]],
  },
];

const PANEL = { left: 880, top: 40, width: 900, height: 1000 };
const K = 1.5;
const PW = PANEL.width / K;
const PH = PANEL.height / K;

export function Story({ frame }: { frame: number }) {
  return (
    <>
      <Captions frame={frame} caps={CAPS} until={T.end.start} />
      <Panel frame={frame} />
    </>
  );
}

function Panel({ frame }: { frame: number }) {
  const cuts = [T.rain.start, T.type.start];
  const w = (i: number) => (i === 0 ? 1 : prog(frame, cuts[i - 1], 12, SOFT)) * (i === cuts.length ? 1 : 1 - prog(frame, cuts[i], 12, SOFT));
  const screens = [LessonScreen, RainScreen, TypeScreen];
  return (
    <div style={{ position: "absolute", ...PANEL, borderRadius: 28, border: `1.5px solid ${C.line2}`, overflow: "hidden", background: C.paper, ...fall(frame, T.lesson.start, 24, 18) }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: PW, height: PH, transform: `scale(${K})`, transformOrigin: "0 0", fontFamily: FONT.ui, color: C.ink }}>
        {screens.map((Screen, i) =>
          w(i) > 0 ? (
            <div key={i} style={{ position: "absolute", inset: 0, opacity: w(i), background: C.paper }}>
              <Screen frame={frame} />
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}

/** 画面の中身（ページの左右の余白）。 */
function Page({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 63, padding: "0 16px", overflow: "hidden", ...style }}>{children}</div>;
}

/** ページの印（最初の16字の、点の帯）。 */
function Dots({ n, at }: { n: number; at: number }) {
  return (
    <div style={{ display: "flex", gap: 4, padding: "10px 0 0" }}>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= at ? C.accent : C.line, opacity: i === at ? 0.5 : 1 }} />
      ))}
    </div>
  );
}

const pageOf = (s: string) => <span style={{ fontSize: 13, color: C.faint, letterSpacing: "0.04em" }}>{s}</span>;
const pill = (s: ReactNode, on = false) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      minHeight: 36,
      padding: "0 12px",
      borderRadius: 999,
      border: `1px solid ${on ? C.accent : C.line2}`,
      background: on ? C.tint : C.paper,
      color: on ? C.accent : C.ink,
      fontSize: 13,
    }}
  >
    {s}
  </span>
);

// ---- 最初の16字：口の形 -------------------------------------------------------------------------------------------

const DIM_VOWEL = new Set(["0:jung"]);

function LessonScreen({ frame }: { frame: number }) {
  const t = T.lesson;
  const steps = ["くちびるを閉じる。", "正面から見た、閉じた口が ㅁ。"];
  const shown = [t.shut, t.write];
  return (
    <>
      <Page>
        <Bar title="最初の16字" right={<>{pageOf("5 / 23")}{pill("とばす")}</>} />
        <Dots n={23} at={4} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "20px 0" }}>
          <p style={big}>「マミムメモ」と言ってみて。</p>
          <span style={{ width: 280, height: 280, alignSelf: "center" }}>
            <MouthPicture ch="ㅁ" write={prog(frame, t.write, 24)} lift={prog(frame, t.lift, 18)} />
          </span>
          <div>
            {steps.map((s, i) => (
              <p key={s} style={{ ...text, opacity: prog(frame, shown[i], 15, SOFT), transform: `translateY(${4 * (1 - prog(frame, shown[i], 15, SOFT))}px)` }}>
                {s}
              </p>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, opacity: prog(frame, t.lift, 12, SOFT) }}>
            <Speak play={sounding(frame, "마")} />
            <Word text="마" height={40} dim={DIM_VOWEL} />
            <span style={{ flex: 1, fontSize: 14, lineHeight: 1.7, color: C.ink2 }}>いまの字は、左の ㅁ。右の ㅏ は「ア」（あとで出てきます）。</span>
          </div>
        </div>
      </Page>
      <BottomNav active="rain" />
    </>
  );
}

// ---- 浴びる -------------------------------------------------------------------------------------------------------

/** 語のカード（WordCard）。`open`：押してから。`chips`：字（new：まだ出会っていない、点線）。`again`：また降ってきた語。 */
function WordCard({
  ko: word,
  ja,
  frame,
  fallAt,
  open = -1,
  chips = [],
  again = false,
  odd,
}: {
  ko: string;
  ja?: string;
  frame: number;
  fallAt: number;
  open?: number;
  chips?: { ch: string; vowel?: boolean; isNew?: boolean; press?: number }[];
  again?: boolean;
  odd: boolean;
}) {
  const opened = open >= 0 && frame >= open;
  return (
    <div style={{ display: "flex", flexDirection: "column", borderBottom: `1px solid ${C.line}`, borderRight: odd ? `1px solid ${C.line}` : undefined, ...fall(frame, fallAt, 28, 21) }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 104, padding: "16px 8px 8px", background: again ? C.againTint : undefined }}>
        <Word text={word} height={56} ink={!opened} />
        {open >= 0 ? <Press t={frame - open} size={70} /> : null}
      </div>
      {opened ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "0 8px 14px", ...rise(frame, open, 8, 10) }}>
          <p style={{ margin: 0, fontSize: 14, color: C.ink2 }}>{ja}</p>
          <p style={{ margin: 0, display: "flex", gap: 4 }}>
            {chips.map((c) => (
              <span
                key={c.ch}
                style={{
                  position: "relative",
                  minWidth: 30,
                  height: 30,
                  padding: "0 6px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: c.isNew ? `1.5px dashed ${C.accent}` : `1px solid ${C.line2}`,
                  borderRadius: 8,
                  fontFamily: FONT.ko,
                  fontSize: 15,
                  color: c.vowel ? C.accent : C.ink,
                }}
              >
                {c.ch}
                {c.press !== undefined ? <Press t={frame - c.press} size={40} /> : null}
              </span>
            ))}
          </p>
        </div>
      ) : null}
    </div>
  );
}

const RAIN_WORDS = ["카드", "바나나", "코코아", "라디오", "키", "드라마"];

function RainScreen({ frame }: { frame: number }) {
  const t = T.rain;
  const sheet = frame >= t.sheet - 2 && frame < t.close + 12;
  const up = frame < t.close ? prog(frame, t.sheet, 12) : 1 - prog(frame, t.close, 10, SOFT);
  return (
    <>
      <Page>
        <Bar title="浴びる" />
        <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "16px 0" }}>
          <Track steps={RAIN_STEPS} at={0} />
          <p style={lead}>読んでから押してみて。音と意味で答え合わせ。</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", borderTop: `1px solid ${C.line}` }}>
            {RAIN_WORDS.map((w, i) => (
              <WordCard
                key={w}
                ko={w}
                ja={w === "카드" ? "カード" : undefined}
                frame={frame}
                fallAt={t.fall + Math.round(i * 3.6)}
                open={w === "카드" ? t.press : -1}
                chips={[
                  { ch: "ㅋ", isNew: true, press: t.chip },
                  { ch: "ㅏ", vowel: true },
                  { ch: "ㄷ" },
                  { ch: "ㅡ", vowel: true },
                ]}
                odd={i % 2 === 0}
              />
            ))}
          </div>
        </div>
      </Page>
      <BottomNav active="rain" />
      {sheet ? <LetterSheet frame={frame} up={up} at={t.sheet} /> : null}
    </>
  );
}

/** その場で：ㅋ のシート（LetterSheet）。下からせり上がる。 */
function LetterSheet({ frame, up, at }: { frame: number; up: number; at: number }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 20 }}>
      <div style={{ position: "absolute", inset: 0, background: `rgba(23,32,51,${0.32 * up})` }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 520,
          background: C.paper,
          borderRadius: "20px 20px 0 0",
          transform: `translateY(${(1 - up) * 540}px)`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 14px", borderBottom: `1px solid ${C.line}` }}>
          <span style={{ display: "inline-flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.muted }}>子音</span>
            <span style={{ fontFamily: FONT.ko, fontSize: 22, fontWeight: 600 }}>ㅋ</span>
          </span>
          <Icon name="close" size={20} color={C.muted} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px 20px" }}>
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <Letter ch="ㅋ" size={112} write={prog(frame, at + 8, 18)} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 600, display: "flex", flexDirection: "column", gap: 2 }}>
                カ行<span style={{ fontSize: 13.5, fontWeight: 400, color: C.muted }}>息を強く出す</span>
              </p>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Speak play={sounding(frame, "카")} />
                <span style={{ fontFamily: FONT.ko, fontSize: 18, color: C.ink2 }}>카</span>
              </span>
            </div>
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10, color: C.faint }}>
            <Letter ch="ㄱ" size={36} />
            <Icon name="arrow" size={18} />
            <Letter ch="ㅋ" size={36} added write={prog(frame, at + 14, 12)} />
          </span>
          <p style={{ margin: 0, fontSize: 15 }}>ㄱ に線が1本</p>
          <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 4, display: "flex", flexDirection: "column", gap: 6 }}>
            <p style={{ margin: "8px 0 0", fontSize: 13, fontWeight: 600, color: C.muted }}>キーボードでは</p>
            <KeyMap lit={["ㅋ"]} />
            <p style={{ margin: 0, fontSize: 13.5, color: C.ink2 }}>左の小指</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- 打ってみる ---------------------------------------------------------------------------------------------------

const FINGER: Record<string, string> = {
  lp: "左の小指",
  lr: "左の薬指",
  lm: "左の中指",
  li: "左の人さし指",
  ri: "右の人さし指",
  rm: "右の中指",
  rr: "右の薬指",
  rp: "右の小指",
};
const PLAN = keysFor("카드");
const LIT = new Set(PLAN.map((p) => p.key));

/** 打ってみるは縦に長い：電話で少し下へ送ったところを見せる（帯と流れの上が隠れ、キーボードが入りきる）。 */
const TYPE_SCROLL = 110;

function TypeScreen({ frame }: { frame: number }) {
  const t = T.type;
  const local = frame - t.type;
  const keys = frame >= t.type ? keysAt(TYPE, local) : [];
  const kb = typeKeys(keys);
  const g = guide(kb, PLAN);
  const done = keys.length === PLAN.length && g.ok === PLAN.length;
  const typed = textOf(kb);
  const making = composing(kb);
  const next = done ? null : g.back ? "⌫" : (g.next?.key ?? null);
  const finger = next && next !== "⌫" ? FINGER[KEY_OF.get(next)?.finger ?? ""] : null;
  const last = [...TYPE.presses].reverse().find((p) => p.at <= local);
  const cut = g.back ? 0 : done ? typed.length : typed.length - making.length;
  return (
    <>
      <Page>
        <div style={{ transform: `translateY(${-TYPE_SCROLL}px)` }}>
        <Bar title="浴びる" />
        <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "16px 0" }}>
          <Track steps={RAIN_STEPS} at={2} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={lead}>聞いて、自分の指で打ってみて。</p>
            {pageOf("1 / 3")}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Speak play={sounding(frame, "카드")} />
            <p style={{ flex: 1, margin: 0, fontSize: 15, fontWeight: 600 }}>カード</p>
            {pill(
              <>
                <Icon name="hint" size={17} />
                案内
              </>,
              true,
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "center", padding: "6px 0 2px" }}>
            <Word text="카드" height={60} />
          </div>
          <div
            style={{
              minHeight: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 12px",
              borderBottom: `1.5px solid ${done ? C.accent : C.ink}`,
              background: done ? C.tint : undefined,
              borderRadius: done ? "12px 12px 0 0" : 0,
            }}
          >
            {typed ? (
              <span style={{ fontFamily: FONT.ko, fontSize: 32, lineHeight: 1.3 }}>
                {g.back ? (
                  <span style={{ color: C.again, textDecoration: `underline wavy ${C.again}`, textUnderlineOffset: "0.22em" }}>{typed}</span>
                ) : (
                  <>
                    {typed.slice(0, cut)}
                    <span style={{ textDecoration: `underline ${C.accent} 2px`, textUnderlineOffset: "0.2em" }}>{typed.slice(cut)}</span>
                  </>
                )}
                {done ? null : <Caret on={Math.floor(frame / 16) % 2 === 0} />}
              </span>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: C.faint }}>
                <Caret on={Math.floor(frame / 16) % 2 === 0} />
                ここに打った字が出ます
              </span>
            )}
          </div>
          <p style={{ margin: 0, minHeight: "1.6em", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: done ? 15 : 13.5, fontWeight: done ? 600 : 400, color: done ? C.accent : g.back ? C.again : C.muted }}>
            {done ? (
              <>
                <Icon name="check" size={18} />
                そのとおり
              </>
            ) : g.back ? (
              `⌫ で${g.back}つ戻る`
            ) : (
              finger
            )}
          </p>
          <Keyboard next={next} lit={LIT} pressed={last?.key} pressT={last ? local - last.at : -99} />
        </div>
        </div>
      </Page>
      <BottomNav active="rain" />
    </>
  );
}
