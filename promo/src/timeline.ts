// いつ何が起きるか（秒で決めて、コマにする）。ナレーションの長さはクリップの長さ（src/voice.json：scripts/voice.mjs が
// 書く）から、打つ長さは打ち方（anim.ts typing）から。声が言い終わってから、次のできごとへ進む。韓国語の語は、アプリ
// 自身の声（public/app/clips）を、ナレーションと重ならない所で。
//
// 見る人：ハングルが記号に見えている人。はじめの一秒から問いかけて、ハングルがどれだけ分かりやすいかを速く見せる：
// この字、何の形？（「カキクケコ」の舌の形）、子音は口の形、同じ場所で線を一本足すと別の音、母音は六つ、組むと一つの音、
// 十六字で読める。そこで、ハングルを世に出した本（『訓民正音』1446年）の一文「賢い者は朝のうちに、愚かな者でも十日で」
// が答え合わせになる：朝のうちに、読みはじめられる。それから、それがアプリで学べること：最初の16字をひとつずつ、音つき
// の語を浴びて知らない字はその場で、聞いた語を自分の指で打つ。引用から入ると退屈で、はじめの数秒で離れられる。
import { f, typing } from "./anim";
import VOICE from "./voice.json";

/** 打ってみる：카드。はじめの ㅋ を ㄱ と打ち間違えて、⌫ で戻ってから打ち直す。 */
export const TYPE = typing("카드", { per: 7, slip: 0, wrong: "ㄱ", wait: 26 });

/** 母音：六つ、音といっしょに一つずつ（秒の間）。 */
export const VOWELS = ["ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅡ", "ㅣ"];
const VOWEL_SAY = ["아", "어", "오", "우", "으", "이"];
export const VOWEL_STEP = 0.68;
/** 十六字で読める語：一つずつ、書かれて鳴る（秒の間）。 */
export const READ: [ko: string, ja: string][] = [
  ["라디오", "ラジオ"],
  ["바나나", "バナナ"],
  ["드라마", "ドラマ"],
];
export const READ_STEP = 1.2;

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
  // A. 問い：ハングルのこの字、何の形？（大きな ㄱ）。答え：字が口の絵の舌へ降りて重なる。「カキクケコ」の舌の形。가。
  // 口の絵は左へ寄り、右に ㄴ：大きな ㄴ が舌の先へ降りる。「ナニヌネノ」なら、この形。나。
  // 子音五つ。線を一本足すと別の音（ㄴ→ㄷ…）。母音六つ。組むと一つの音（나무）。十六字で読める（라디오・바나나・드라마）。
  const hook = { start: 0, reveal: 0, answer: 0, ka: 0, second: 0, land: 0, na1: 0, five: 0, grow: 0, grown: 0, na: 0, da: 0, vowels: 0, vowel0: 0, join: 0, joined: 0, tree: 0, read: 0, read0: 0, end: 0 };
  hook.reveal = say("O01", 0.15) + 0.1;
  hook.answer = hook.reveal + 0.25;
  hook.ka = say("O02", hook.answer) + 0.15;
  hook.second = play("가", hook.ka) + 0.25;
  const o03 = hook.second + 0.5;
  // 「この形」のところで、ㄴ が舌に降りる。
  hook.land = o03 + said("O03") * 0.55;
  hook.na1 = say("O03", o03) + 0.2;
  hook.five = play("나", hook.na1) + 0.35;
  hook.grow = say("V03", hook.five + 0.6) + 0.3;
  // 「線を一本足すと」のところで、線が書かれる。
  hook.grown = hook.grow + said("H01") * 0.4;
  hook.na = say("H01", hook.grow) + 0.15;
  hook.da = play("나", hook.na) + 0.05;
  hook.vowels = play("다", hook.da) + 0.55;
  hook.vowel0 = say("H02", hook.vowels) + 0.1;
  VOWEL_SAY.forEach((s, i) => play(s, hook.vowel0 + i * VOWEL_STEP));
  hook.join = hook.vowel0 + VOWEL_SAY.length * VOWEL_STEP + 0.4;
  hook.joined = say("H03", hook.join) - 0.5;
  hook.tree = hook.joined + 1.0;
  hook.read = play("나무", hook.tree) + 0.6;
  hook.read0 = say("V04", hook.read) + 0.1;
  READ.forEach(([w], i) => play(w, hook.read0 + i * READ_STEP));
  hook.end = hook.read0 + READ.length * READ_STEP + 0.4;

  // B. 答え合わせ：『訓民正音』の一文が縦二行で（すばやく）。訳が二行。「不終朝」が灯って、朝のうちに、読みはじめられる。
  const quote = { start: hook.end, chars: hook.end + 0.2, gloss1: 0, gloss2: 0, lit: 0, end: 0 };
  quote.gloss1 = say("Q01", quote.start + 0.4) + 0.3;
  quote.gloss2 = quote.gloss1 + said("Q02") * 0.5;
  quote.lit = say("Q02", quote.gloss1) + 0.35;
  quote.end = say("H04", quote.lit) + 0.8;

  // C. ことのめ
  const title = { start: quote.end, icon: quote.end + 0.3, word: quote.end + 0.7, lead: quote.end + 1.5, end: 0 };
  title.end = say("V05", title.word - 0.05) + 0.5;

  // D1. アプリの最初の16字：ㅁ の口のページ（正面の口）。くちびるを閉じ、字が書かれ、絵から離れて、마。
  const lesson = { start: title.end - 0.2, cap: 0, shut: 0, write: 0, lift: 0, end: 0 };
  lesson.cap = lesson.start + 0.4;
  lesson.shut = lesson.start + 0.7;
  lesson.write = lesson.start + 1.6;
  lesson.lift = lesson.start + 2.7;
  const a01 = say("A01", lesson.start + 0.5);
  lesson.end = play("마", Math.max(lesson.lift + 0.7, a01 + 0.1)) + 0.6;

  // D2. 浴びる：6つの語が降る。카드 を押す（音と意味と字）。知らない ㅋ を押すと、その場で字のシート。
  const rain = { start: lesson.end, cap: 0, fall: 0, press: 0, cap2: 0, chip: 0, sheet: 0, close: 0, end: 0 };
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

  // D3. 打ってみる：카드 を、두벌식で。ㅋ を ㄱ と打ち間違えて ⌫。打ち終えると、その語が鳴る。
  const type = { start: rain.end, cap: 0, hear: 0, type: 0, done: 0, end: 0 };
  type.cap = type.start + 0.4;
  type.hear = play("카드", type.start + 0.5) + 0.1;
  const v10 = say("V10", type.hear + 0.1);
  type.type = Math.max(type.hear + 0.6, v10 - sec(TYPE.duration) - 0.2);
  type.done = type.type + sec(TYPE.duration);
  type.end = play("카드", Math.max(type.done + 0.2, v10 + 0.1)) + 1.1;

  // E. 終わり
  const end = { start: type.end, icon: type.end + 0.3, word: type.end + 0.7, lead: type.end + 1.4, rest: type.end + 2.1, end: 0 };
  end.end = Math.max(end.start + 5.8, say("V14", end.word + 0.05) + 1.6);

  return { hook, quote, title, lesson, rain, type, end };
}

const S = make();
const frames = <T extends Record<string, number>>(o: T) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, f(v)])) as { [K in keyof T]: number };

export const T = {
  hook: frames(S.hook),
  quote: frames(S.quote),
  title: frames(S.title),
  lesson: frames(S.lesson),
  rain: frames(S.rain),
  type: frames(S.type),
  end: frames(S.end),
};

export const TOTAL = f(S.end.end);

/** ナレーション：クリップと、鳴らしはじめるコマ・声が消えるコマ（音楽はこの間だけ下がる）。 */
export const VOICE_AT = cues.map((c) => ({ id: c.id, from: f(c.at), until: f(c.at + said(c.id)) }));

/** アプリの声：語・音節と、鳴らすコマ。 */
export const CLIP_AT = clips.map((c) => ({ text: c.text, from: f(c.at), until: f(c.at + ([...c.text].length > 1 ? WORD_LEN : SYL_LEN)) }));

/** `text` が `frame` に鳴っていれば、鳴りはじめてからのコマ（なければ -1）。 */
export function sounding(frame: number, text: string): number {
  for (const c of CLIP_AT) if (c.text === text && frame >= c.from && frame < c.until) return frame - c.from;
  return -1;
}

/**
 * 音楽の区切り（秒）。scripts/music.py に渡す：はじめから分散和音がまばらに入り（和音だけの前置きはない）、子音五つから
 * 流れ、名前（とアプリ）で鐘が答え、終わりのカードで主和音に帰る。
 */
export const MUSIC_MARKS = { title: 0, story: S.hook.five, later: S.title.start, end: S.end.start, total: S.end.end };
