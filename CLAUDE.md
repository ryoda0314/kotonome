@AGENTS.md

# ことのめ

Read [CONCEPT.md](CONCEPT.md) before adding anything. A little at a time, and practised many times right after it is
understood (CONCEPT.md 原則2): the learner is never handed a page of new letters, and nothing new is seen only once. A feature that does not fit the flow (最初に90秒 → 浴びる → 気づく →
打ってみる → また出会う) does not get built. No scores, no accuracy shown, no speed, no streaks, no badges, no forced
review, no table of letters to memorize up front, no rules taught first (no 天地人, no lessons on how vowels are built or
how sounds change), no katakana readings. Beyond the first 90 seconds every letter is met inside words and sentences and
looked up there and then. The sister apps are ことのあめ (`../polylinga`), ことのは (`../english`), ことのおと
(`../作品,app/chinese`) and ことのね (`../作成したもの/hanjaatume`); this one borrows their look, their accounts and their way
of keeping a record. The way of learning is the maker's own (https://note.com/ryoda_/n/n4e69c14a99cb): the film's 90
seconds (`promo/`, 爆速ハングル), then sentences with sound, each new letter looked up when met, typed on the standard
Korean keyboard (as on 한컴타자연습) and heard.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, plain CSS modules. Same versions as the sisters. `npm run dev` serves on
  port 3230. No server routes: every page is the client reading static content and the learner's record.
- The learner's record (`State`, `src/lib/record.ts`) is on their device (`src/lib/store.ts`, localStorage key
  `hangul:v1`, every access guarded); signing in is optional. With a ことのあめ account (the same Supabase project, so the
  same accounts) it is also kept in `hg_records`, one row per account (`supabase/migrations/`, RLS: only their own row),
  read and written from the browser as the learner with the anon key (`src/lib/sync.ts`, ことのは's). The two copies are
  merged, never overwritten (`mergeStates`). Everything of this app's in that project is prefixed `hg_` (named for the
  script, not the app); never touch `pl_`, `kn_`, `en_` or the old app's tables, and do not create test users there.
  Without `NEXT_PUBLIC_SUPABASE_URL`/`_ANON_KEY` the app runs on the device only and says so.
- The content is TypeScript in `src/content/` (typed, checked by `tests/content.test.mjs`); its audio is static MP3 in
  `public/audio/<voice>/<clip id>.mp3`, listed in `src/content/audio.json`.

## The core (`src/lib`, pure, tested in `tests/`)

- `hangul.ts`: syllables into letters and back (Unicode arithmetic), and what each of the 40 letters is: the Japanese
  hand-hold (カ行, 口を大きく開けたオ), how the mouth does it, a plain note on its shape (shown only once it is met).
  `FIRST_LETTERS`: the 90 seconds' 16 (the mouth's ㄱ ㄴ ㅇ ㅁ ㅅ, grown from them in the same places ㄷ ㅂ ㅈ ㅎ, ㄹ,
  and ㅏ ㅓ ㅗ ㅜ ㅡ ㅣ); `from` on a letter is the one it
  grew from or the two it is made of (ㅁ → ㅂ, ㅗ ＋ ㅏ → ㅘ), shown beside it in 答え合わせ (`components/Grown.tsx`). Two
  ways of reading are met like letters: `PATCHIM` (받침, a consonant under the vowel) and `SAID` (발음, a word said otherwise than spelled beyond a
  closing consonant said as one of seven). `MEET_ORDER`: the order the rest come in the rains, one a rain, what opens
  the most everyday words first. `needsOf(word)`: what a text asks beyond the 90 seconds. `clipId`: romanization + 4 hex
  of FNV-1a, the same name in the browser and the scripts.
- `dubeol.ts`: the standard keyboard, 두벌식 (KS X 5002): the layout by physical key code (KeyQ is ㅂ whatever is printed
  on it; Shift for ㅃ ㅉ ㄸ ㄲ ㅆ ㅒ ㅖ), and what the keys make, as a Korean input method: a consonant after a vowel
  closes the syllable, a vowel takes it on to the next, two vowels make one (ㅗㅏ → ㅘ), two closing consonants make one
  (ㄹㄱ → ㄺ) and give the second away before a vowel. ⌫ takes back one key. `keysFor(text)`: the only way to type a text,
  key by key, each key with the letter it belongs to; `guide` compares the keys pressed with it (next key, how many ⌫,
  the letter that should have come where it went off). Punctuation is shown, never typed (`normalize`).
- `record.ts`: the record. Only events are kept (times): when the 90 seconds were seen (`first`), letters and ways met
  (`met`), mixed up while typing (`mixed`) and typed right again (`cleared`), words read and typed, sentences typed,
  rounds of 자리연습, rains. `knownSet`: the 90 seconds' letters and everything met. A letter mixed up is owed and comes
  back after `RETURN_MS` or `RETURN_RAINS`, whichever first (`isDue`); letters met in the last two rains come again
  (`freshLetters`). `mergeStates` keeps everything either copy has. `revive` accepts only this shape (v2): a record from
  before the redesign (v1, the eight steps) is left behind.
- `rain-core.ts`: what falls in a rain. The first rain has nothing new (90 seconds' letters only, loanwords first: read,
  and the meaning is there). Each rain after it brings the next thing in `MEET_ORDER` not met yet (`nextToMeet`; a
  letter met by looking it up is passed over): up to 3 of the 6 words hold it, in its plainest words; the rest readable,
  due letters first, then letters just met, then never read. 3 to type, the new one's first. Up to 2 of ことのあめ's
  sentences with the words, the fewest letters not met first (at most `LINE_UNKNOWN_MAX`), from the rain that brings
  パッチム.
- `practice.ts`: the goes of 練習 (`rounds`: shuffled rounds, never the same twice in a row, seeded so always the same;
  `again`: a missed go once more a little later; `practiceFor`: after 気づく, the new letter twice to each of up to three
  rivals (what it grew from, the same kana row, its kind; never two said alike, ㅐ/ㅔ), two rounds).
- `typing-core.ts`: 자리연습's rows (the keyboard's), a round of letters (every key, never twice in a row), words to type
  (readable ones, read and not yet typed first), sentences to type (the fewest letters not met first).
- `export.ts`: the whole record as one Markdown text for an AI of the learner's choice (学習の記録); no AI call.
- `sentences.ts`: where a word stands in one of ことのあめ's sentences (`pieceOf`: the word with nothing or a particle
  after it, so 간 is not found in 간단히; a few one-syllable words that are mostly something else, 해 나 다 김 …, are not
  looked for). The export script and the rain share it.

## The app

- `/` intro (static). `/app` 浴びる (`_rain/Start.tsx`): the 90 seconds the first time (`_first/First.tsx`: three mouth
  pictures from the side with the letter taken out of each, `components/Mouth.tsx`, then 思い出す (`_parts/Practice.tsx`:
  hear, press the letter, every letter three rounds; a wrong press shows the mouth again and that go comes once more a
  little later; nothing counted), two from the front and 思い出す for all five, then a stroke more in the same place two
  pairs at a time (ㄴ → ㄷ, ㅁ → ㅂ; ㅅ → ㅈ, ㅇ → ㅎ: the plain one's mouth, the two letters, 나 then 다) each two
  practised at once, ㄹ by its shape (like ら) and practised with ㄴ ㄷ, the six vowels to hear and 思い出す, two letters sliding into a square, three words read with only these; とばす passes it over
  and counts as seen), then the rain (`_rain/Rain.tsx`): 浴びる (words fall; read, then press: sound, vowels lit, meaning, letters, a
  letter not met dashed) → 気づく when something is new (`_rain/Notice.tsx`: the words holding it with it lit, hear, then
  答え合わせ and 聞き比べる `_parts/Compare.tsx`, then すぐ練習: the new letter among those it is told from, 10 goes, or
  for パッチム words like 산/삼/상) → 打ってみる (`components/TypeLine.tsx`, 3 words) → 文の中で
  (`_rain/Lines.tsx`, ことのあめ's clips from its public `pl-audio` bucket; a syllable holding a letter not met is dotted
  and opens it, `components/KoText.tsx`) → the new thing and the letters typed off the way are said to come back
  (violet). `/app/first`: the 90 seconds again (from 自分).
- `/app/type` 打つ: 자리연습 by row (`/app/type/keys/[row]`, `_type/Drill.tsx`), 単語 (`_type/WordsRound.tsx`), 短文
  (`_type/LinesRound.tsx`), 打って聞く (`_type/Free.tsx`: a word's or sentence's own clip, else the device's Korean voice).
- `/app/me` 自分: counts (own, never compared), the letters (the 90 seconds', then `MEET_ORDER`; faint until met, violet
  when owed; looked up from here they are not met), days, the 90 seconds again, 学習の記録, `/app/me/settings` (sound,
  voice, the typing guide, account, clearing the record). `/login`: ことのは's, unchanged in kind.
- `components/Keyboard.tsx`: the 두벌식 keyboard on screen, and the keyboard in front of the learner by key code (ignored
  while a sheet is open or an input has the focus); the next key lit, letters not in use faint; keys never take the
  focus. `KeyMap`: the keyboard small and still, a key lit. `components/TypeLine.tsx`: a word or sentence to type: the
  text, what has been typed (the syllable being made underlined, off the way violet), the finger for the next key, ⌫ to
  go back; done when every key is in, then said; `onTyped` keeps it at once, `onDone` moves on.
- `components/LetterSheet.tsx`: その場で, a letter (or パッチム, or 発音) over any page (`useOpenLetter`): sound, shape,
  where it is on the keyboard, other words. Opening it is meeting it, except from 自分's table (`{ meet: false }`).
  `components/Glyph.tsx`: drawing strokes; `useMorph` keeps a stroke the same stroke across changes (it slides), driven
  in JS because Safari does not animate CSS `d`. `components/sound.ts`: a text's clip in one of two voices (by turns, or
  the one chosen in settings), the device's Korean voice when there is no clip, one sound at a time (`player.ts`,
  ことのおと's).

## Content and audio

- `src/content/words.ts` (~380 words: meaning, kind, `say` where the sound differs from the letters), grouped by the
  thing whose meeting opens them; `pairs.ts` (words one letter apart, heard side by side when a letter is met: 딸/달);
  `clips.ts` (every text that gets a clip: the words and the syllables a letter is heard in on its own). A new word
  needs a clip: `tests/content.test.mjs` checks every word has one (but those waiting for a person's ear) and that each
  thing in `MEET_ORDER` opens at least two words once those before it are met.
- `scripts/generate-audio.mjs`: Gemini TTS on Vertex (2.5 Flash: neither ことのあめ's live voice nor ことのは's replies use
  its quota), voices Kore (f) and Charon (m), the bare text as the prompt (probing: an instruction in Korean once made
  가 come out as 바, `scripts/probe-tts.mjs`). A word passes when gpt-4o-transcribe hears it; a lone syllable, or a word
  that failed, is asked again with its rivals named (pairs, and the syllables one letter away), both orders, by
  gpt-4o-transcribe and gpt-4o-mini-transcribe. ㅐ/ㅔ (and ㅒ/ㅖ, ㅙ/ㅞ/ㅚ) count as one. Failing takes are made again;
  then `data/review.json` waits for a person (`data/approved.json` lets a take through). Raw takes in `scripts/work/raw`
  (not committed); recognizer answers cached in `data/asr.json`; state in `data/clips.json`. Resumable: the same command
  picks up where it stopped. Run with ことのおと's keys (see Commands).
- `scripts/publish-audio.mjs`: passing takes → `public/audio/<voice>/<id>.mp3` (48 kbps, trimmed and levelled as checked)
  and `src/content/audio.json`. `scripts/review-page.mjs`: `public/review/index.html` (dev server) to listen to the
  takes waiting for a person, beside the other voice.
- `scripts/export-sentences.mjs` (with ことのあめ's public values): approved sentences of at most 14 syllables, only
  Hangul and punctuation, holding one of the words (`pieceOf`), three per word at most, kept only if their clip exists
  → `src/content/sentences.json`. `tests/dubeol.test.mjs` types every one of them from its keys.

## Commands

- `npm run dev` / `npm run build` / `npm run lint` / `npm test` (node:test, `tests/*.test.mjs`)
- `npx tsc --noEmit` (run `npx next typegen` first after adding routes)
- `node --env-file=../作品,app/chinese/.env.local scripts/generate-audio.mjs [--voices=kore] [--limit=20] [--no-generate]`
- `node scripts/publish-audio.mjs`; `node scripts/review-page.mjs`
- `node --env-file=../polylinga/.env.local scripts/export-sentences.mjs`
- `node --env-file=../polylinga/.env.local ../polylinga/scripts/migrate.mjs supabase/migrations/<file>.sql`: apply one
  migration to ことのあめ's database (ことのあめ's runner and connection settings). Not applied yet for `hg_records`.
- `python design/make-icons.py design/icon-source.png .`: the icons (Pillow, numpy).

## Conventions

- UI copy in `src/lib/i18n/ja.ts`, plain, from the learner's side. Names (パッチム, 発音) and notes on a letter's shape
  appear only after the thing has been seen: in 答え合わせ and in its sheet.
- Colors and type are the sisters' (`src/app/globals.css`): paper, ink, one accent, `--again` violet for what comes back
  (and for what was typed off the way). In a syllable, consonants are ink and the vowel is the accent; on the keyboard
  too. No gradients, emoji or shadows inside the app; hairlines separate. The mouth drawings use flat colours from the
  same file.
- Letters and words to read are drawn from strokes (`Letter`, `Word`), not set in a font; sentences, what is typed and
  the keys are text.
- Pure modules imported by tests and scripts use `.ts` extensions in their imports (Node strips types).
- Phone first; from 720 px the tabs become a column on the left (BottomNav, the sisters' CSS).
- The app icon is the one picture with gradients: for now 雨に育つパステルの芽 from ことのあめ's folder
  (`design/icon-source.png`); the maker may choose another and run `design/make-icons.py` again.

## The promotional film (`promo/`)

Its own Remotion project (its own package.json; left out of the app's tsconfig and eslint), described in
`promo/README.md`: 爆速ハングル, 3:48, Zundamon by VOICEVOX. `cd promo && node bin/build.mjs && npm run render`.
