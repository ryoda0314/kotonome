// D. もう一度、名前と一行。タブと、はじめ方（登録はいらない、記録は端末に残る）。
import { fall } from "../anim";
import { T } from "../timeline";
import { C, FONT } from "../theme";
import { Icon, type IconName } from "../ui";
import { NameMark } from "./Mark";

const TABS: [IconName, string][] = [
  ["rain", "浴びる"],
  ["keys", "打つ"],
  ["user", "自分"],
];

export function End({ frame }: { frame: number }) {
  const e = T.end;
  return (
    <>
      <NameMark frame={frame} icon={e.icon} word={e.word} lead={e.lead} size={210} top={120} wordSize={88} leadSize={40} />
      <div style={{ position: "absolute", top: 610, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 48, ...fall(frame, e.lead + 8, 10, 16) }}>
        {TABS.map(([icon, name]) => (
          <span key={name} style={{ display: "inline-flex", alignItems: "center", gap: 12, fontSize: 28, color: C.ink2, fontFamily: FONT.ja }}>
            <Icon name={icon} size={30} stroke={1.7} />
            {name}
          </span>
        ))}
      </div>
      <p style={{ position: "absolute", top: 740, left: 0, right: 0, margin: 0, textAlign: "center", fontSize: 28, color: C.muted, fontFamily: FONT.ja, ...fall(frame, e.rest, 14, 18) }}>
        登録はいりません。記録は、この端末に残ります。
      </p>
    </>
  );
}
