// timeline.json の実測から YouTube の説明欄（目次つき）を out/youtube.md に書く。
// 目次は手で直さない。章を変えたら build → このスクリプト。
// YouTube の目次の条件: 先頭が 00:00・3章以上・各章10秒以上（1つでも欠けると目次全体が無効）
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const tl = JSON.parse(readFileSync(join(ROOT, 'src', 'generated', 'timeline.json'), 'utf8'));

const NAMES = {
  intro: 'ハングルは口の形の絵',
  cons: '子音の基本5つ（舌・口・歯・のど）',
  plus: '線を足すと強い音／ㄹ／双子の字',
  vowel: '母音は天・地・人の3パーツ',
  block: '組み立て方とパッチム7つ',
  read: '実践：8単語を3秒で読む',
  outro: '早見表',
};
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// 10秒未満の章は次の章に吸収させる（冒頭の掴みは9秒ほどしかない）
const chapters = [];
let carry = null;
for (const s of tl.scenes) {
  const start = carry ?? s.start;
  if (s.end - start < 10) { carry = start; continue; }
  chapters.push({ t: chapters.length === 0 ? 0 : start, len: s.end - start, name: NAMES[s.id] });
  carry = null;
}
const bad = chapters.filter((c) => c.len < 10);
if (bad.length) throw new Error(`10秒未満の章があり、YouTube の目次が無効になる: ${bad.map((c) => c.name).join(', ')}`);
const total = mmss(tl.duration);

const md = `# 爆速ハングル — YouTube 掲載文（${total}）

## タイトル

\`\`\`
ハングルが4分で読めるようになる動画｜文字は口の形の絵【ずんだもん】
\`\`\`

## 説明欄

\`\`\`
ハングルは、ただの記号ではありません。子音は「舌・口・歯・のど」の形の絵、母音は「天・地・人」の3パーツの組み合わせです。
この仕組みが分かれば、子音14字・母音21字・パッチム7つを丸暗記せずに読めるようになります。最後に8単語（김・커피・라면・서울・불고기・오빠・한글・안녕하세요）で実際に読んでみます。

▼目次
${chapters.map((c) => `${mmss(c.t)} ${c.name}`).join('\n')}

最後の早見表は一時停止して保存してどうぞ。

──────────
音声：VOICEVOX:ずんだもん
BGM：ニコニ・コモンズ nc20349 / nc116360 / nc90501
立ち絵：（配布元と表記を記入）
参考：『訓民正音 解例本』（1446年）鄭麟趾 序
\`\`\`

## 公開前の確認

- [ ] 立ち絵の配布元・規約・必要な表記（explanation/docs/CREDITS.md で「配布元不明」になっている）
- [ ] BGM 3曲のニコニ・コモンズの利用条件（クレジット表記の形式・YouTube での利用可否）
- [ ] 東北ずん子・ずんだもんプロジェクトのキャラクター利用ガイドライン
`;

mkdirSync(join(ROOT, 'out'), { recursive: true });
writeFileSync(join(ROOT, 'out', 'youtube.md'), md);
console.log(md.split('▼目次')[1].split('最後の')[0].trim());
