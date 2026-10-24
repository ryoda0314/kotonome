// ことのめ の画面を、映像のために描き直したもの（../src/**/*.module.css、../src/app/globals.css）。大きさはアプリの px
// のまま、画面は CSS の拡大で大きく見せる。ひとりでには動かない：どの変化もコマで決まる。
import type { CSSProperties, ReactNode } from "react";
import { Img, staticFile } from "remotion";
import { KEY_OF, ROWS, isVowelKey } from "../../src/lib/dubeol.ts";
import { C, FONT } from "./theme";

// ---- アイコン（../src/components/Icon.tsx） ----------------------------------------------------------------------

const PATHS = {
  speaker: (
    <>
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </>
  ),
  back: <path d="M15 18l-6-6 6-6" />,
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  sprout: (
    <>
      <path d="M12 21v-9" />
      <path d="M12 12c0-4-3-6.5-7.5-6.5 0 4.2 3 6.5 7.5 6.5z" />
      <path d="M12 14.5c0-4 2.8-6.5 7.5-6.5 0 4.2-3 6.5-7.5 6.5z" />
    </>
  ),
  rain: (
    <>
      <path d="M7 13.5h10a3.5 3.5 0 0 0 .2-7A5 5 0 0 0 7.7 7.6 3 3 0 0 0 7 13.5z" />
      <path d="M9 17v2.5" />
      <path d="M12 16.5v4" />
      <path d="M15 17v2.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  keys: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <path d="M6.5 10h1M10.5 10h1M14.5 10h1M8 14h8" />
    </>
  ),
  lines: <path d="M4 7h16M4 12h12M4 17h14" />,
  erase: (
    <>
      <path d="M8.5 5H20a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H8.5L3 12z" />
      <path d="M11.5 9.5l5 5M16.5 9.5l-5 5" />
    </>
  ),
  hint: (
    <>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
    </>
  ),
  shift: <path d="M12 4 4 12.5h4.5V20h7v-7.5H20z" />,
};
export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, color = "currentColor", stroke = 1.8 }: { name: IconName; size?: number; color?: string; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flexShrink: 0 }}>
      {PATHS[name]}
    </svg>
  );
}

export const rgba = (hex: string, a: number) => `rgba(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(",")},${a})`;

// ---- 小さな部品 ------------------------------------------------------------------------------------------------------

/** 指で押したところ：輪が寄って、離れる。`t` は押してからのコマ（前なら負）。 */
export function Press({ t, x = "50%", y = "50%", size = 46 }: { t: number; x?: number | string; y?: number | string; size?: number }) {
  if (t < -8 || t > 16) return null;
  const inP = Math.min(1, (t + 8) / 8);
  const outP = t > 0 ? Math.min(1, t / 16) : 0;
  return (
    <span
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        borderRadius: "50%",
        background: rgba(C.ink, 0.14 * inP * (1 - outP)),
        border: `2px solid ${rgba(C.ink, 0.32 * inP * (1 - outP))}`,
        transform: `scale(${1.25 - 0.25 * inP + 0.5 * outP})`,
        pointerEvents: "none",
        zIndex: 5,
      }}
    />
  );
}

/** 鳴っている間、ボタンから広がる波紋（ことのあめ と同じ）。`t`：鳴りはじめてからのコマ（鳴っていなければ負）。 */
export function Ripple({ t, color = C.accent }: { t: number; color?: string }) {
  if (t < 0) return null;
  return (
    <>
      {[0, 24].map((d) => {
        const p = (((t - d) % 48) + 48) % 48 / 48;
        if (t < d) return null;
        return (
          <span
            key={d}
            style={{ position: "absolute", inset: -1, borderRadius: "50%", border: `1.5px solid ${color}`, opacity: 0.55 * (1 - p), transform: `scale(${1 + 0.7 * p})` }}
          />
        );
      })}
    </>
  );
}

/** 読み上げのボタン（Speak.module.css）。`play`：鳴りはじめてからのコマ。 */
export function Speak({ size = 44, play = -1, solid = false }: { size?: number; play?: number; solid?: boolean }) {
  return (
    <span
      style={{
        position: "relative",
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: "50%",
        border: `1px solid ${solid || play >= 0 ? C.accent : C.line2}`,
        background: solid ? C.accent : C.paper,
        color: solid ? "#fff" : play >= 0 ? C.accent : C.ink,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name="speaker" size={size >= 70 ? 30 : size >= 60 ? 24 : 20} />
      <Ripple t={play} />
    </span>
  );
}

/** ボタン（globals.css の .btn / .btn-quiet）。 */
export function Btn({ children, quiet = false, press = -99, style }: { children: ReactNode; quiet?: boolean; press?: number; style?: CSSProperties }) {
  const pressed = press >= 0 && press < 6;
  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        minHeight: quiet ? 48 : 52,
        padding: quiet ? "0 18px" : "0 24px",
        borderRadius: 12,
        border: `1px solid ${quiet ? C.line2 : C.accent}`,
        background: quiet ? C.paper : C.accent,
        color: quiet ? C.ink : "#fff",
        fontSize: quiet ? 15 : 16,
        fontWeight: quiet ? 500 : 600,
        fontFamily: FONT.ui,
        transform: pressed ? "scale(0.97)" : undefined,
        flexShrink: 0,
        ...style,
      }}
    >
      {children}
      <Press t={press} />
    </span>
  );
}

/** 上の帯（page.module.css の .bar）。 */
export function Bar({ title, sub, right }: { title: ReactNode; sub?: string; right?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 60, padding: "8px 0", borderBottom: `1px solid ${C.line}` }}>
      <h1 style={{ flex: 1, minWidth: 0, margin: 0, fontSize: 17, fontWeight: 600, lineHeight: 1.4, fontFamily: FONT.ui }}>
        {sub ? <span style={{ display: "block", fontSize: 12.5, fontWeight: 400, color: C.muted }}>{sub}</span> : null}
        {title}
      </h1>
      {right}
    </div>
  );
}

export const lead: CSSProperties = { margin: 0, fontSize: 15, lineHeight: 1.75, color: C.muted, fontFamily: FONT.ui };
export const big: CSSProperties = { margin: 0, fontSize: 19, fontWeight: 600, lineHeight: 1.6, fontFamily: FONT.ui };
export const text: CSSProperties = { margin: 0, fontSize: 16, lineHeight: 1.85, fontFamily: FONT.ui };

/** 雨の流れ（track.module.css）：済んだ所は印、いまの所は灯り、先は薄く。 */
export function Track({ steps, at }: { steps: { icon: IconName; label: string }[]; at: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`, padding: "4px 0 16px", borderBottom: `1px solid ${C.line}` }}>
      {steps.map((s, i) => {
        const state = i < at ? "done" : i === at ? "now" : "next";
        return (
          <div key={s.label} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, minWidth: 0 }}>
            {i > 0 ? (
              <span style={{ position: "absolute", top: 19, right: "50%", width: "100%", height: 2, background: i <= at ? C.accent : C.line2 }} />
            ) : null}
            <span
              style={{
                position: "relative",
                zIndex: 1,
                width: 40,
                height: 40,
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: `2px solid ${state === "next" ? C.line2 : C.accent}`,
                background: state === "done" ? C.accent : state === "now" ? C.tint : C.paper,
                color: state === "done" ? "#fff" : state === "now" ? C.accent : C.faint,
                outline: state === "now" ? `4px solid ${C.tint}` : undefined,
                outlineOffset: 2,
              }}
            >
              <Icon name={state === "done" ? "check" : s.icon} size={20} />
            </span>
            <span style={{ fontSize: 12, lineHeight: 1.3, whiteSpace: "nowrap", color: state === "done" ? C.ink2 : state === "now" ? C.accent : C.faint, fontWeight: state === "now" ? 600 : 400 }}>
              {i + 1} {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export const RAIN_STEPS: { icon: IconName; label: string }[] = [
  { icon: "rain", label: "浴びる" },
  { icon: "eye", label: "気づく" },
  { icon: "keys", label: "打ってみる" },
  { icon: "lines", label: "文の中で" },
];

/** 下のタブ（BottomNav）。 */
export function BottomNav({ active }: { active: "rain" | "type" | "me" }) {
  const items: [typeof active, IconName, string][] = [
    ["rain", "rain", "浴びる"],
    ["type", "keys", "打つ"],
    ["me", "user", "自分"],
  ];
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", background: C.paper, borderTop: `1px solid ${C.line}`, padding: "4px 8px 8px", zIndex: 8 }}>
      {items.map(([id, icon, name]) => (
        <span key={id} style={{ minHeight: 50, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, fontSize: 11, color: id === active ? C.accent : C.muted, fontWeight: id === active ? 600 : 400 }}>
          <Icon name={icon} size={22} />
          {name}
        </span>
      ))}
    </div>
  );
}

/** アイコンと、明朝の ことのめ。 */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <Img src={staticFile("app/icon.png")} style={{ width: size, height: size, borderRadius: "22%" }} />
      <span style={{ fontFamily: FONT.mincho, fontWeight: 700, fontSize: size * 0.6, letterSpacing: "0.06em", lineHeight: 1.2 }}>ことのめ</span>
    </span>
  );
}

// ---- 두벌식のキーボード（components/Keyboard.tsx・Keyboard.module.css） --------------------------------------------

/**
 * `next`：次に押すキー（字、" "、"⌫"）。`lit`：使う字（ほかは薄く）。`pressed`：いま押されたキー（字、"⌫"、" "）と、
 * 押してからのコマ。
 */
export function Keyboard({ next, lit, pressed, pressT = -99 }: { next?: string | null; lit?: ReadonlySet<string>; pressed?: string; pressT?: number }) {
  const guide = next && next !== "⌫" && next !== " " ? KEY_OF.get(next) : undefined;
  const flash = pressT >= 0 && pressT < 5;
  const key = (k: (typeof ROWS)[number][number]) => {
    const isNext = guide?.code === k.code;
    const inUse = !lit || lit.has(k.jamo) || (!!k.shifted && lit.has(k.shifted));
    const down = flash && (pressed === k.jamo || pressed === k.shifted);
    return (
      <span
        key={k.code}
        style={{
          position: "relative",
          gridColumn: "span 2",
          height: 46,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1px solid ${isNext ? C.accent : C.line2}`,
          borderRadius: 8,
          background: isNext ? C.accent : down ? C.tint : C.paper,
          color: isNext ? "#fff" : isVowelKey(k.jamo) ? C.accent : C.ink,
          opacity: inUse || isNext ? 1 : 0.32,
          fontFamily: FONT.ko,
          fontSize: 19,
          transform: down ? "scale(0.94)" : undefined,
        }}
      >
        {k.jamo}
        {down ? <Press t={pressT} size={40} /> : null}
      </span>
    );
  };
  const mod = (span: number, content: ReactNode, isNext = false, down = false, col?: string) => (
    <span
      style={{
        position: "relative",
        gridColumn: col ?? `span ${span}`,
        height: 46,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: `1px solid ${isNext ? C.accent : C.line2}`,
        borderRadius: 8,
        background: isNext ? C.accent : down ? C.tint : C.paper,
        color: isNext ? "#fff" : C.ink2,
        transform: down ? "scale(0.95)" : undefined,
      }}
    >
      {content}
      {down ? <Press t={pressT} size={44} /> : null}
    </span>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(20, minmax(0, 1fr))", gap: 5, padding: 6, border: `1px solid ${C.line}`, borderRadius: 14, background: C.surface }}>
      {ROWS[0].map(key)}
      <span style={{ gridColumn: "span 1" }} />
      {ROWS[1].map(key)}
      {mod(3, <Icon name="shift" size={20} />)}
      {ROWS[2].map(key)}
      {mod(3, <Icon name="erase" size={22} />, next === "⌫", flash && pressed === "⌫")}
      {mod(12, <span style={{ fontSize: 12.5, color: next === " " ? "#fff" : C.muted }}>スペース</span>, next === " ", false, "5 / span 12")}
    </div>
  );
}

/** 小さく止まったキーボードで、字の場所を光らせる（LetterSheet の KeyMap）。 */
export function KeyMap({ lit }: { lit: string[] }) {
  const on = new Set(lit.map((j) => KEY_OF.get(j)?.code));
  const cell = (k: (typeof ROWS)[number][number]) => (
    <span
      key={k.code}
      style={{
        gridColumn: "span 2",
        height: 26,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: `1px solid ${on.has(k.code) ? C.accent : C.line2}`,
        borderRadius: 5,
        background: on.has(k.code) ? C.accent : C.paper,
        color: on.has(k.code) ? "#fff" : C.faint,
        fontFamily: FONT.ko,
        fontSize: 12.5,
        fontWeight: on.has(k.code) ? 600 : 400,
      }}
    >
      {k.jamo}
    </span>
  );
  return (
    <span style={{ display: "inline-grid", gridTemplateColumns: "repeat(20, 12px)", gap: 2, padding: 6, border: `1px solid ${C.line}`, borderRadius: 10, background: C.surface }}>
      {ROWS[0].map(cell)}
      <span style={{ gridColumn: "span 1" }} />
      {ROWS[1].map(cell)}
      <span style={{ gridColumn: "span 3", height: 26, display: "inline-flex", alignItems: "center", justifyContent: "center", border: `1px solid ${C.line2}`, borderRadius: 5, background: C.paper, color: C.faint }}>
        <Icon name="shift" size={12} />
      </span>
      {ROWS[2].map(cell)}
    </span>
  );
}

export function Caret({ on = true }: { on?: boolean }) {
  return <span style={{ display: "inline-block", width: 2, height: "1.05em", marginLeft: 2, verticalAlign: "-0.12em", background: C.accent, opacity: on ? 1 : 0 }} />;
}
