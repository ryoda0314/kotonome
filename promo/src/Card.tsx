// 一目でわかる紹介画像（npm run card、1920×1080）：名前と一行、それに三つの所——最初の90秒（口の形の字）、浴びる（音つき
// の語、知らない字はその場で）、打つ（ふつうの韓国語キーボード）。
import { AbsoluteFill, Img, staticFile } from "remotion";
import { Letter, Word } from "./glyph";
import { MouthPicture } from "./mouth";
import { C, FONT, useFonts } from "./theme";
import { Keyboard } from "./ui";

function Point({ n, title, body, children }: { n: string; title: string; body: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, padding: "34px 34px 30px", border: `1.5px solid ${C.line2}`, borderRadius: 24, background: C.paper, minWidth: 0 }}>
      <div style={{ height: 250, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 600, color: C.accent }}>{n}</p>
      <p style={{ margin: 0, fontSize: 36, fontWeight: 600, lineHeight: 1.35 }}>{title}</p>
      <p style={{ margin: 0, fontSize: 24, lineHeight: 1.7, color: C.ink2 }}>{body}</p>
    </div>
  );
}

export function Card() {
  useFonts();
  return (
    <AbsoluteFill style={{ background: C.paper, color: C.ink, fontFamily: FONT.ui, padding: "70px 90px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
        <Img src={staticFile("app/icon.png")} style={{ width: 120, height: 120, borderRadius: "22%" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontFamily: FONT.mincho, fontWeight: 700, fontSize: 76, letterSpacing: "0.06em", lineHeight: 1.1 }}>ことのめ</span>
          <span style={{ fontSize: 36, fontWeight: 600 }}>90秒だけ知って、あとは浴びる。</span>
        </div>
      </div>
      <div style={{ marginTop: 56, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 36 }}>
        <Point n="最初の90秒" title="子音は口の形、母音は音で" body="少し見たら、すぐ何度も思い出す。字の表は覚えない。">
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <span style={{ width: 210, height: 210 }}>
              <MouthPicture ch="ㄱ" />
            </span>
            <Letter ch="ㄱ" size={120} color={C.accent} />
          </div>
        </Point>
        <Point n="浴びる" title="音つきの語が、雨のように" body="知らない字は、押せばその場で。打ち間違えた字は、また降ってくる。">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%" }}>
            {["카드", "라디오", "코코아", "바나나"].map((w) => (
              <span key={w} style={{ display: "flex", justifyContent: "center", padding: "18px 6px", border: `1px solid ${C.line}`, borderRadius: 12 }}>
                <Word text={w} height={58} />
              </span>
            ))}
          </div>
        </Point>
        <Point n="打つ" title="ふつうの韓国語キーボードで" body="聞いた語を、自分の指で打つ。スマホやパソコンと同じ두벌식。">
          <div style={{ width: 440, zoom: 1 }}>
            <Keyboard next="ㅋ" lit={new Set(["ㅋ", "ㅏ", "ㄷ", "ㅡ"])} />
          </div>
        </Point>
      </div>
      <p style={{ position: "absolute", left: 90, bottom: 56, margin: 0, fontSize: 24, color: C.muted }}>登録はいりません。記録は、この端末に残ります。姉妹アプリ ことのあめ の例文と音声も。</p>
    </AbsoluteFill>
  );
}
