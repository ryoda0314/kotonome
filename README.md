# ことのめ

最初の16字だけ、子音は口の形（ㄱ は舌の奥、ㅁ は閉じた口）、母音は音で知る。あとは音つきの語を浴び、知らない字は
出会ったときにその場で調べ、聞いた語をふつうの韓国語キーボード（두벌식）で自分の指で打って、音で確かめる。字の表から
入らず、規則も先に教えない学習アプリ。作者が韓国語を身につけたやり方（[note](https://note.com/ryoda_/n/n4e69c14a99cb)）
をそのまま形にしたもの。思想は [CONCEPT.md](CONCEPT.md)、作りは [CLAUDE.md](CLAUDE.md)。
ことのあめ（`../polylinga`）、ことのは（`../english`）、ことのおと（`../作品,app/chinese`）、ことのね（`../作成したもの/hanjaatume`）の姉妹。
紹介映像は `promo/`、もとになった学習アニメーション（爆速ハングル）は `film/`。

## Setup

```bash
npm install
npm run dev                  # http://localhost:3230
```

The repository carries the content (`src/content/`), the clips (`public/audio/`) and the icons, so the app runs
without generating anything and without any keys. The record stays on the device.

### Linking ことのあめ accounts (optional, not done yet)

The record can also be kept in the learner's ことのあめ account (the same Supabase project as the sisters). Two steps:

1. Apply the migration once with ことのあめ's runner (it adds the table `hg_records` to ことのあめ's database):
   ```bash
   node --env-file=../polylinga/.env.local ../polylinga/scripts/migrate.mjs supabase/migrations/20261022120000_hg_records.sql
   ```
2. `cp .env.example .env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ことのあめ's
   public values). For Google sign-in, add this app's addresses to ことのあめ's OAuth client and set
   `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

## Growing the words

1. Add words to `src/content/words.ts` under the group of the thing whose meeting opens them (pairs to `pairs.ts`).
2. `node --env-file=../作品,app/chinese/.env.local scripts/generate-audio.mjs` makes and checks the new clips (it stops
   politely when the quota refuses and resumes with the same command). Clips that fail three takes wait in
   `data/review.json` for a person to listen; a take let through by hand goes in `data/approved.json`.
3. `node scripts/publish-audio.mjs`, then `npm test` (every word must have its clip).
