import { useEffect, useState } from "react";
import { staticFile, useDelayRender } from "remotion";

// ことのめ の紙と墨と、アクセント（../src/app/globals.css）。紫は、また出会うもの。口の絵の色も同じところから。
export const C = {
  paper: "#fcfbf8",
  surface: "#f1f4f8",
  ink: "#172033",
  ink2: "#3b4558",
  muted: "#5c6578",
  faint: "#8c94a5",
  line: "#e4e7ec",
  line2: "#d4d9e1",
  accent: "#0a64f0",
  tint: "#e6f0ff",
  again: "#6a4fe0",
  againTint: "#efebff",
  skin: "#f7e3d4",
  skinLine: "#b98a6c",
  cavity: "#6b2f3c",
  tongue: "#ec8b98",
  tongueLine: "#b4475a",
} as const;

export const FONT = {
  ui: `"PlexJP", "PlexKR", sans-serif`,
  ja: `"PlexJP", sans-serif`,
  ko: `"PlexKR", "PlexJP", sans-serif`,
  mincho: `"Shippori", serif`,
  // 『訓民正音』の一文（漢文）。㑹 のある明朝（しっぽり明朝にも IBM Plex にも無い）。
  classic: `"SerifSC", serif`,
} as const;

// アプリの字と、引用の明朝。`npm run assets` が public/fonts に置く。
const FACES: [family: string, file: string, weight: string][] = [
  ["PlexJP", "fonts/IBMPlexSansJP-Regular.ttf", "400"],
  ["PlexJP", "fonts/IBMPlexSansJP-Medium.ttf", "500"],
  ["PlexJP", "fonts/IBMPlexSansJP-SemiBold.ttf", "600"],
  ["PlexKR", "fonts/IBMPlexSansKR-Regular.ttf", "400"],
  ["PlexKR", "fonts/IBMPlexSansKR-Medium.ttf", "500"],
  ["PlexKR", "fonts/IBMPlexSansKR-SemiBold.ttf", "600"],
  ["Shippori", "fonts/ShipporiMincho-Bold.ttf", "700"],
  ["SerifSC", "fonts/NotoSerifSC-Bold.ttf", "700"],
];

let loading: Promise<unknown> | null = null;

/** 字が読み終わるまで、どのコマも待たせる（映像の根から呼ぶ）。 */
export function useFonts() {
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    loading ??= Promise.all(
      FACES.map(([family, file, weight]) => {
        const face = new FontFace(family, `url(${staticFile(file)})`, { weight });
        document.fonts.add(face);
        return face.load();
      }),
    );
    loading.then(() => continueRender(handle), cancelRender);
  }, [handle, continueRender, cancelRender]);
}
