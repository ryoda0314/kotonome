// いつ何が起きるか（秒で決めて、コマにする）。ナレーションの長さはクリップの長さ（src/voice.json：scripts/voice.mjs が
// 書く）から、例文の声は src/clips.json（scripts/assets.mjs）から、打つ長さは打ち方（anim.ts typing）から。声が言い
// 終わってから、次のできごとへ進む。韓国語の語は、アプリ自身の声（public/app/clips）を、ナレーションと重ならない所で。
//
// 見る人：ハングルが記号に見えていて、字の表を前に止まっている人。最初の16字だけで読みはじめられること、そのあとは
// 音つきの語を浴び、知らない字はその場で、聞いた語はふつうのキーボードで自分の指で打つ、を、アプリの画面で見せる。
import { f, typing } from "./anim";
import CLIPS from "./clips.json";
import VOICE from "./voice.json";

/** 打ってみる：카드。はじめの ㅋ を ㄱ と打ち間違えて、⌫ で戻ってから打ち直す。 */
export const TYPE = typing("카드", { per: 7, slip: 0, wrong: "ㄱ", wait: 26 });

const sec = (frames: number) => frames / 30;

type VoiceId = keyof typeof VOICE;
/** クリップの末尾の余白（声が消えてから残した 250ms と、足した 120ms）。次の声やできごとは、ここに重ねてよい。 */
const TAIL = 0.37;
const said = (id: VoiceId) => VOICE[id] - TAIL;
/** ナレーションを置いた時（秒）。 */
const cues: { id: VoiceId; at: number }[] = [];
const say = (id: VoiceId, at: number) => {
  cues.push({ id, at });
  return at + said(id);
};

/** アプリの声（語・音節）を鳴らす時。長さはどれも短いので、決まった長さで見ておく。 */
const clips: { text: string; at: number }[] = [];
const WORD_LEN = 1.0;
const SYL_LEN = 0.7;
const play = (text: string, at: number) => {
  clips.push({ text, at });
  return at + ([...text].length > 1 ? WORD_LEN : SYL_LEN);
};

function make() {
  // A. 問い：記号に見える語。口の形（ㄱ を口の絵から取り出す）。5つの字。라디오 が読める。
  const hook = { start: 0, words: 0.2, mouth: 0, pose: 0, write: 0, lift: 0, five: 0, join: 0, read: 0, end: 0 };
  hook.mouth = say("V01", 0.6) + 0.45;
  hook.pose = hook.mouth + 0.5;
  const v02 = say("V02", hook.mouth + 0.3);
  // 「その形が、この字。」のところで書き、言い終わると絵から離れる。
  hook.write = v02 - 1.7;
  hook.lift = v02 + 0.15;
  hook.five = play("가", hook.lift + 0.45) + 0.35;
  hook.join = say("V03", hook.five + 0.6) + 0.35;
  hook.read = hook.join + 1.0;
  hook.end = say("V04", play("라디오", hook.read + 0.2) + 0.35) + 0.6;

  // B. ことのめ
  const title = { start: hook.end, icon: hook.end + 0.3, word: hook.end + 0.7, lead: hook.end + 1.5, end: 0 };
  title.end = say("V05", title.word - 0.05) + 0.5;

  // C1. 最初の16字：思い出す。나 → ㄴ。아 → ㄱ と押して間違え、口の絵が出て、ㅇ。가 → ㄱ。
  const first = { start: title.end - 0.2, cap: 0, go1: 0, press1: 0, go2: 0, wrong2: 0, press2: 0, go3: 0, press3: 0, end: 0 };
  first.cap = first.start + 0.4;
  first.go1 = say("V06", first.start + 0.5) + 0.25;
  first.press1 = play("나", first.go1) + 0.15;
  first.go2 = first.press1 + 0.95;
  first.wrong2 = play("아", first.go2) + 0.2;
  first.press2 = play("아", first.wrong2 + 0.15) + 0.55;
  first.go3 = first.press2 + 0.95;
  first.press3 = play("가", first.go3) + 0.1;
  first.end = first.press3 + 1.3;

  // C2. 浴びる：6つの語が降る。카드 を押す（音と意味と字）。知らない ㅋ を押すと、その場で字のシート。
  const rain = { start: first.end, cap: 0, fall: 0, press: 0, cap2: 0, chip: 0, sheet: 0, close: 0, end: 0 };
  rain.cap = rain.start + 0.4;
  rain.fall = rain.start + 0.45;
  rain.press = say("V07", rain.start + 0.5) + 0.25;
  play("카드", rain.press);
  rain.cap2 = rain.press + 1.25;
  const v08 = say("V08", rain.cap2);
  rain.chip = rain.cap2 + 1.15;
  rain.sheet = rain.chip + 0.25;
  rain.close = play("카", v08 + 0.25) + 0.9;
  rain.end = rain.close + 0.45;

  // C3. 気づく：ㅋ の入った 카드・코코아・키 を並べて、押して聞く。答え合わせ。
  const notice = { start: rain.end, cap: 0, w1: 0, w2: 0, w3: 0, reveal: 0, end: 0 };
  notice.cap = notice.start + 0.4;
  notice.w1 = say("V09", notice.start + 0.5) + 0.25;
  notice.w2 = play("카드", notice.w1) + 0.1;
  notice.w3 = play("코코아", notice.w2) + 0.1;
  notice.reveal = play("키", notice.w3) + 0.3;
  notice.end = notice.reveal + 2.6;

  // C4. 打ってみる：카드 を、두벌식で。ㅋ を ㄱ と打ち間違えて ⌫。打ち終えると、その語が鳴る。
  const type = { start: notice.end, cap: 0, hear: 0, type: 0, done: 0, end: 0 };
  type.cap = type.start + 0.4;
  type.hear = play("카드", type.start + 0.5) + 0.1;
  const v10 = say("V10", type.hear + 0.1);
  type.type = Math.max(type.hear + 0.6, v10 - sec(TYPE.duration) - 0.2);
  type.done = type.type + sec(TYPE.duration);
  type.end = play("카드", Math.max(type.done + 0.2, v10 + 0.1)) + 1.1;

  // C5. 文の中で：ことのあめ の例文「여기 카드 되는구나.」が、例文の声で。訳を見る。
  const lines = { start: type.end, cap: 0, play: 0, translate: 0, end: 0 };
  lines.cap = lines.start + 0.4;
  lines.play = say("V11", lines.start + 0.5) + 0.25;
  lines.translate = lines.play + CLIPS.line + 0.3;
  lines.end = lines.translate + 1.8;

  // C6. また出会う：雨のおわり（はじめての字 ㅋ、打ち間違えた字 ㅋ）。次の雨で、ㅋ の入った別の語が紫で降る。
  const again = { start: lines.end, cap: 0, next: 0, fall: 0, end: 0 };
  again.cap = again.start + 0.4;
  again.next = say("V12", again.start + 0.5) + 0.3;
  again.fall = again.next + 0.3;
  again.end = again.fall + 2.4;

  // C7. 次の字：ㄱ の口のまま、線をもう1本で ㅋ。가 → 카。
  const next = { start: again.end, cap: 0, grow: 0, s1: 0, s2: 0, end: 0 };
  next.cap = next.start + 0.4;
  next.grow = next.start + 0.9;
  next.s1 = say("V13", next.start + 0.5) + 0.25;
  next.s2 = play("가", next.s1) + 0.2;
  next.end = play("카", next.s2) + 1.2;

  // D. 終わり
  const end = { start: next.end, icon: next.end + 0.3, word: next.end + 0.7, lead: next.end + 1.4, rest: next.end + 2.1, end: 0 };
  end.end = Math.max(end.start + 5.8, say("V14", end.word + 0.05) + 1.6);

  return { hook, title, first, rain, notice, type, lines, again, next, end };
}

const S = make();
const frames = <T extends Record<string, number>>(o: T) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, f(v)])) as { [K in keyof T]: number };

export const T = {
  hook: frames(S.hook),
  title: frames(S.title),
  first: frames(S.first),
  rain: frames(S.rain),
  notice: frames(S.notice),
  type: frames(S.type),
  lines: frames(S.lines),
  again: frames(S.again),
  next: frames(S.next),
  end: frames(S.end),
};

export const TOTAL = f(S.end.end);

/** ナレーション：クリップと、鳴らしはじめるコマ・声が消えるコマ（音楽はこの間だけ下がる）。 */
export const VOICE_AT = cues.map((c) => ({ id: c.id, from: f(c.at), until: f(c.at + said(c.id)) }));

/** アプリの声：語・音節と、鳴らすコマ。 */
export const CLIP_AT = clips.map((c) => ({ text: c.text, from: f(c.at), until: f(c.at + ([...c.text].length > 1 ? WORD_LEN : SYL_LEN)) }));

/** 例文の声のコマ。 */
export const LINE_AT = { from: f(S.lines.play), until: f(S.lines.play + CLIPS.line) };

/** `text` が `frame` に鳴っていれば、鳴りはじめてからのコマ（なければ -1）。 */
export function sounding(frame: number, text: string): number {
  for (const c of CLIP_AT) if (c.text === text && frame >= c.from && frame < c.until) return frame - c.from;
  return -1;
}

/** 音楽の区切り（秒）。scripts/music.py に渡す。 */
export const MUSIC_MARKS = { title: S.title.start, story: S.first.start, later: S.lines.start, end: S.end.start, total: S.end.end };
