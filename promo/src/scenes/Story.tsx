// C. アプリの画面で、ひとめぐり。左に映像の言葉、右にアプリ。
//   最初の16字：思い出す（音を聞いて字を押す。間違えると、その字を描いた口の絵）。
//   浴びる：6つの語が降る。카드 を押すと音と意味と字。知らない ㅋ を押すと、その場で字のシート。
//   気づく：ㅋ の入った 카드・코코아・키 を並べて聞く。答え合わせ（ㄱ に線が1本）。
//   打ってみる：카드 を두벌식で。ㅋ を ㄱ と打ち間違えて ⌫、打ち直す。打ち終えると 카드 が鳴る。
//   文の中で：ことのあめ の例文「여기 카드 되는구나.」を例文の声で。点線の 되 は、まだ出会っていない字。
//   また出会う：雨のおわり。次の雨で ㅋ の入った別の語が紫で降る。
//   次の字：ㄱ の口のまま、線をもう1本で ㅋ。
import type { CSSProperties, ReactNode } from "react";
import { guide, keysFor, typeKeys, textOf, composing, KEY_OF } from "../../../src/lib/dubeol.ts";
import { lettersOf } from "../../../src/lib/hangul.ts";
import { fall, keysAt, prog, rise, SOFT } from "../anim";
import { Letter, Word } from "../glyph";
import { MouthPicture } from "../mouth";
import { LINE_AT, sounding, T, TYPE } from "../timeline";
import { C, FONT } from "../theme";
import { Bar, big, BottomNav, Btn, Caret, Icon, KeyMap, Keyboard, lead, Press, RAIN_STEPS, Ripple, Speak, text, Track } from "../ui";
import { Captions, type Cap } from "./Caption";

const ko = (t: string, color?: string) => ({ text: t, font: "ko" as const, color });

/** 映像の言葉。 */
const CAPS: Cap[] = [
  { from: T.first.cap, door: "first", main: [["少し見たら、"], ["すぐ何度も思い出す。"]], sub: [["音を聞いて、その字を押す。どの字も3回ずつ。"], ["間違えたら、口の形をもう一度。"]] },
  { from: T.rain.cap, door: "rain", main: [["音つきの語が、"], ["雨のように降ってくる。"]], sub: [["読んでから押すと、音と意味。"]] },
  { from: T.rain.cap2, door: "rain", main: [["知らない字は、"], ["押せばその場で。"]], sub: [["音と形と、キーボードの場所。"]] },
  { from: T.notice.cap, door: "notice", main: [["同じ字が、"], ["どの語にも。"]], sub: [["どんな音だろう？ 聞いてから、答え合わせ。"]] },
  {
    from: T.type.cap,
    door: "type",
    main: [["聞いた語を、"], ["自分の指で打つ。"]],
    sub: [["スマホやパソコンと同じ、ふつうの韓国語キーボード。"], ["次のキーが光る。打ち間違えたら、⌫ で戻る。"]],
  },
  { from: T.lines.cap, door: "lines", main: [["同じ語に、"], ["ふだんの文の中で。"]], sub: [["ことのあめ の例文が、音声つきで。"], ["点線の字は、押すとその場で分かる。"]] },
  { from: T.again.cap, door: "again", main: [["打ち間違えた字は、"], ["また降ってくる。"]], sub: [["日をあけて、別の語の中で。"], ["点数はつけない。忘れていい、また出会えばいい。"]] },
  {
    from: T.next.cap,
    door: "next",
    main: [["次の字も、"], ["知っている字のとなりに。"]],
    sub: [[ko("ㄱ"), " に線をもう1本で ", ko("ㅋ", C.accent), "。"], ["最初の16字と同じやり方の、次の字。"]],
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
  const cuts = [T.rain.start, T.notice.start, T.type.start, T.lines.start, T.again.start, T.next.start];
  const w = (i: number) => (i === 0 ? 1 : prog(frame, cuts[i - 1], 12, SOFT)) * (i === cuts.length ? 1 : 1 - prog(frame, cuts[i], 12, SOFT));
  const screens = [FirstScreen, RainScreen, NoticeScreen, TypeScreen, LinesScreen, AgainScreen, NextScreen];
  return (
    <div style={{ position: "absolute", ...PANEL, borderRadius: 28, border: `1.5px solid ${C.line2}`, overflow: "hidden", background: C.paper, ...fall(frame, T.first.start, 24, 18) }}>
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

/** ページの印（最初の16字と次の字の、点の帯）。 */
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

// ---- 最初の16字：思い出す ----------------------------------------------------------------------------------------

function FirstScreen({ frame }: { frame: number }) {
  const t = T.first;
  const go = frame < t.go2 ? 0 : frame < t.go3 ? 1 : 2;
  const answer = ["ㄴ", "ㅇ", "ㄱ"][go];
  const right = [frame >= t.press1, frame >= t.press2, frame >= t.press3][go];
  const wrong = go === 1 && frame >= t.wrong2 ? ["ㄱ"] : [];
  const total = frame >= t.wrong2 ? 10 : 9;
  // どの字を、いつ押したか。
  const PRESSED: Record<string, number[]> = { "ㄴ": [t.press1], "ㄱ": [t.wrong2, t.press3], "ㅇ": [t.press2] };
  const choice = (ch: string) => {
    const isRight = right && ch === answer;
    const isWrong = wrong.includes(ch);
    return (
      <span
        key={ch}
        style={{
          position: "relative",
          minHeight: 76,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1.5px ${isWrong ? "dashed" : "solid"} ${isRight ? C.accent : C.line2}`,
          borderRadius: 12,
          background: isRight ? C.tint : C.paper,
          opacity: isWrong ? 0.55 : 1,
        }}
      >
        <Letter ch={ch} size={48} color={isRight ? C.accent : undefined} />
        {PRESSED[ch].map((at) => (
          <Press key={at} t={frame - at} size={56} />
        ))}
      </span>
    );
  };
  const playing = Math.max(sounding(frame, "나"), sounding(frame, "아"), sounding(frame, "가"));
  return (
    <>
      <Page>
        <Bar title="最初の16字" right={<>{pageOf("4 / 23")}{pill("とばす")}</>} />
        <Dots n={23} at={3} />
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "20px 0" }}>
          <p style={big}>思い出す</p>
          <p style={text}>分かったら、すぐ何度も。音を聞いて、その字を押してみて。口の形を思い出して。</p>
          <div style={{ position: "relative", display: "flex", justifyContent: "center", padding: "4px 0" }}>
            <span style={{ position: "relative", width: 76, height: 76, borderRadius: "50%", background: C.accent, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="speaker" size={30} />
              <Ripple t={playing} />
            </span>
            <span style={{ position: "absolute", right: 0, top: 30 }}>{pageOf(`${go + 1} / ${total}`)}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>{["ㄱ", "ㄴ", "ㅇ"].map(choice)}</div>
          <div style={{ minHeight: 128 }}>
            {right ? (
              <p style={{ margin: 0, textAlign: "center", fontSize: 16, fontWeight: 600, color: C.accent }}>そう、これ。</p>
            ) : wrong.length ? (
              <div style={{ display: "flex", alignItems: "center", gap: 14, ...fall(frame, t.wrong2, 8, 9) }}>
                <span style={{ width: 120, height: 120, flexShrink: 0 }}>
                  <MouthPicture ch="ㅇ" write={prog(frame, t.wrong2 + 6, 18)} />
                </span>
                <span style={{ fontSize: 15, lineHeight: 1.7, color: C.ink2 }}>「アー」と言うときの口。</span>
              </div>
            ) : null}
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

// ---- 気づく --------------------------------------------------------------------------------------------------------

/** 語の中の ㅋ の場所（"音節:役割"）。 */
const marksOf = (word: string, ch: string) => new Set(lettersOf(word).filter((l) => l.ch === ch).map((l) => `${l.at}:${l.role}`));
const NOTICED: [string, string][] = [
  ["카드", "カード"],
  ["코코아", "ココア"],
  ["키", "背・鍵"],
];

function NoticeScreen({ frame }: { frame: number }) {
  const t = T.notice;
  const heard = [t.w1, t.w2, t.w3];
  const revealed = frame >= t.reveal;
  return (
    <>
      <Page>
        <Bar title="浴びる" />
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "16px 0" }}>
          <Track steps={RAIN_STEPS} at={1} />
          <p style={lead}>この雨に、はじめての字が混ざっていました。どんな音だろう？ 押して聞いてみて。</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
            {NOTICED.map(([w, ja], i) => {
              const playing = sounding(frame, w) >= 0 && frame >= heard[i];
              return (
                <span
                  key={w}
                  style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    padding: "14px 8px 10px",
                    border: `1px solid ${playing ? C.accent : C.line2}`,
                    outline: playing ? `3px solid ${C.tint}` : undefined,
                    borderRadius: 12,
                    ...fall(frame, t.start + 6 + i * 4, 24, 21),
                  }}
                >
                  <Word text={w} height={w.length > 2 ? 44 : 56} ink marks={marksOf(w, "ㅋ")} />
                  <span style={{ minHeight: "1.4em", fontSize: 13, color: C.muted }}>{frame >= heard[i] ? ja : " "}</span>
                  <Press t={frame - heard[i]} size={64} />
                </span>
              );
            })}
          </div>
          {revealed ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 14, borderTop: `1.5px solid ${C.ink}`, ...rise(frame, t.reveal, 8, 12) }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <Letter ch="ㅋ" size={96} write={prog(frame, t.reveal + 4, 18)} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 600, display: "flex", flexDirection: "column", gap: 2 }}>
                    カ行<span style={{ fontSize: 13.5, fontWeight: 400, color: C.muted }}>息を強く出す</span>
                  </p>
                  <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 18, color: C.ink2 }}>
                    <Speak />
                    <span style={{ fontFamily: FONT.ko }}>카</span>
                  </span>
                </div>
              </div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10, color: C.faint }}>
                <Letter ch="ㄱ" size={44} />
                <Icon name="arrow" size={18} />
                <Letter ch="ㅋ" size={44} added write={prog(frame, t.reveal + 12, 12)} />
              </span>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.75, color: C.ink2 }}>ㄱ に線が1本</p>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 12 }}>
              <Btn quiet press={frame - t.reveal}>
                答え合わせ
              </Btn>
              <Btn quiet>
                次へ
                <Icon name="arrow" size={18} />
              </Btn>
            </div>
          )}
        </div>
      </Page>
      <BottomNav active="rain" />
    </>
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

// ---- 文の中で -----------------------------------------------------------------------------------------------------

function LinesScreen({ frame }: { frame: number }) {
  const t = T.lines;
  const playing = frame >= LINE_AT.from && frame < LINE_AT.until ? frame - LINE_AT.from : -1;
  const shown = frame >= t.translate;
  return (
    <>
      <Page>
        <Bar title="浴びる" />
        <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "16px 0" }}>
          <Track steps={RAIN_STEPS} at={3} />
          <p style={lead}>同じ語が、ふだんの文の中に。読んでから押して聞いてみて。点線の字は、まだ出会っていない字。押すとその場で分かります。</p>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "16px 0", borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, ...fall(frame, t.start + 6, 28, 21) }}>
            <span style={{ position: "relative" }}>
              <Speak play={playing} />
              <Press t={frame - t.play} size={52} />
            </span>
            <div>
              <p style={{ margin: 0, fontSize: 21, lineHeight: 1.7, fontFamily: FONT.ko }}>
                여기 <span style={{ color: C.accent, fontWeight: 600 }}>카드</span>{" "}
                <span style={{ textDecoration: `underline dotted ${C.accent}`, textDecorationThickness: 2, textUnderlineOffset: "0.28em" }}>되</span>는구나.
              </p>
              {shown ? (
                <p style={{ margin: "4px 0 0", fontSize: 14, color: C.muted, ...rise(frame, t.translate, 6, 10) }}>ここカード使えるじゃん。</p>
              ) : (
                <span style={{ position: "relative", fontSize: 13, color: C.accent, textDecoration: "underline", textUnderlineOffset: "0.25em" }}>
                  訳を見る
                  <Press t={frame - t.translate} size={40} />
                </span>
              )}
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: C.faint }}>文と音声は、姉妹アプリ ことのあめ の例文から。</p>
        </div>
      </Page>
      <BottomNav active="rain" />
    </>
  );
}

// ---- また出会う ----------------------------------------------------------------------------------------------------

const NEXT_RAIN: [string, boolean][] = [
  ["코스", true],
  ["나무", false],
  ["크다", true],
  ["바다", false],
  ["키", true],
  ["우리", false],
];

function AgainScreen({ frame }: { frame: number }) {
  const t = T.again;
  const later = frame >= t.fall;
  const chip = (ch: string, color: string, tint: string) => (
    <span style={{ width: 52, height: 52, display: "inline-flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${color}`, borderRadius: 12, background: tint }}>
      <Letter ch={ch} size={30} color={color} />
    </span>
  );
  return (
    <>
      <Page>
        <Bar title="浴びる" />
        {later ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "16px 0" }}>
            <Track steps={RAIN_STEPS} at={0} />
            <p style={{ margin: 0, padding: "8px 12px", borderLeft: `3px solid ${C.again}`, background: C.againTint, fontSize: 14, ...fall(frame, t.fall, 8, 10) }}>前に打ち間違えた字が、また降ってきています</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", borderTop: `1px solid ${C.line}` }}>
              {NEXT_RAIN.map(([w, again], i) => (
                <WordCard key={w} ko={w} frame={frame} fallAt={t.fall + 6 + Math.round(i * 3.6)} again={again} odd={i % 2 === 0} />
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "16px 0" }}>
            <Track steps={RAIN_STEPS} at={4} />
            <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 16, borderTop: `1.5px solid ${C.ink}`, ...rise(frame, t.start + 4, 8, 12) }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.muted }}>この雨のおわりに</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 14, color: C.ink2 }}>はじめての字</span>
                {chip("ㅋ", C.accent, C.tint)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 14px", borderLeft: `3px solid ${C.again}`, background: C.againTint }}>
                <span style={{ fontSize: 14, color: C.ink2 }}>打ち間違えた字</span>
                <span>{chip("ㅋ", C.again, C.paper)}</span>
              </div>
              <p style={lead}>はじめての字と打ち間違えた字は、別の語の中でまた降ってきます。</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "14px 16px", border: `1px solid ${C.line2}`, borderRadius: 12 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: C.accent }}>次の字 ①</span>
                <span style={{ fontSize: 17, fontWeight: 600 }}>息を強く・のどを締めて</span>
                <span style={{ fontSize: 13.5, lineHeight: 1.7, color: C.muted }}>ㅋ ㅌ ㅍ ㅊ と ㄲ ㄸ ㅃ ㅆ ㅉ。知っている字に、線がもう1本か、同じ字がもう1つ。</span>
              </div>
              <span>
                <Btn press={frame - t.next}>次の雨</Btn>
              </span>
            </div>
          </div>
        )}
      </Page>
      <BottomNav active="rain" />
    </>
  );
}

// ---- 次の字 ------------------------------------------------------------------------------------------------------

function NextScreen({ frame }: { frame: number }) {
  const t = T.next;
  return (
    <>
      <Page>
        <Bar
          sub="次の字 ①"
          title="息を強く・のどを締めて"
          right={
            <>
              {pageOf("1 / 17")}
              <Icon name="close" size={20} />
            </>
          }
        />
        <Dots n={17} at={0} />
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "20px 0" }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.muted }}>線をもう1本：息を強く</p>
          <p style={big}>「カ」を、手のひらに息が当たるくらい強く言ってみて。</p>
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "4px 0" }}>
            <span style={{ width: 132, height: 132, flexShrink: 0 }}>
              <MouthPicture ch="ㄱ" />
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10, color: C.faint }}>
              <Letter ch="ㄱ" size={60} />
              <Icon name="arrow" size={18} />
              <Letter ch="ㅋ" size={60} added write={prog(frame, t.grow, 20)} />
            </span>
          </div>
          <p style={text}>息を強く出すと、ㅋ。ㄱ に線が1本。</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 20 }}>
            <Speak size={36} play={sounding(frame, "가")} />
            <span style={{ fontFamily: FONT.ko }}>가</span>
            <span style={{ color: C.faint }}>
              <Icon name="arrow" size={16} />
            </span>
            <Speak size={36} play={sounding(frame, "카")} />
            <span style={{ fontFamily: FONT.ko }}>카</span>
          </div>
        </div>
      </Page>
      <BottomNav active="rain" />
    </>
  );
}
