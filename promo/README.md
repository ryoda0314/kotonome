# 爆速ハングル（ことのめ の紹介の動画）

アプリ ことのめ（このフォルダの親）の紹介の動画。コマンドはすべてこの `promo/` の中で。

ハングルが4分弱で読めるようになる学習アニメーション（16:9・ずんだもん一人語り）。
参考: 「1分30秒でハングルが読めるようになる神動画」（minerva scientia）。発声器官の形→子音、という核はそのままに、
参考動画が扱っていない母音・組み立て・パッチム・実践まで入れた。

```
script.mjs                台本（1行＝1セリフ。say＝読み上げ、sub＝字幕）
   │  npm run build       VOICEVOX で合成 → src/generated/timeline.json（尺・口パク）
   ▼
src/scenes/*.jsx          章ごとのアニメーション。cue('セリフID') で声に合わせて動かす
   │  npm run render
   ▼
out/hangul.mp4
```

## コマンド

| | |
|---|---|
| `npm run build` | 台本を合成（VOICEVOX を起動しておく。字幕だけの修正は再合成ゼロ） |
| `npm run se` | 効果音を作り直す（自前で合成。素材の規約なし） |
| `npm run studio` | ブラウザでプレビュー |
| `node bin/stills.mjs [ID:割合 …]` | 確認用の静止画。`FFMPEG=<xstack のある ffmpeg>` を付けると4枚ずつ並べた一覧も出る |
| `npm run render` | 本番の書き出し（約3分50秒） |
| `FFMPEG=<ffmpeg.exe> node bin/finish.mjs` | 音量を YouTube 向けに（-22.6 → -16 LUFS）。元は out/hangul-raw.mp4 に退避 |
| `node bin/youtube.mjs` | タイトル・説明欄・目次を out/youtube.md に（目次は実測から） |

## 仕組みで気をつけていること

- **字は自前の線データ**（`src/jamo.js`）。フォントを使わないので、1画ずつ描く・足した線だけ黄色・
  字母がブロックの所定位置へ同じ点のまま移動して合体、ができる。母音の足し算（ㅗ＋ㅏ→ㅘ）も
  線の本数と順番をそろえてあるので、そのまま変形する。新しい母音を足すときはこの順番を崩さない
- **色は役割で固定**: 子音＝青・母音＝赤・パッチム＝緑・足した線＝黄
- **say に字母を書かない**（VOICEVOX は読めない。build がエラーにする）。「ッ」単独も無音になるので
  「ちいさい、ツ」と書く。読みは build 後に `.cache/query/*.json` の `kana` で確かめる
- 立ち絵とBGMは `作品,app/explanation/public` から借りている（build が初回にコピー）
