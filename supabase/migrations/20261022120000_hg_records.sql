-- ことのめ: a learner's record (the State of src/lib/record.ts), one row per account. The accounts are ことのあめ's
-- (the same Supabase project, as for ことのおと and ことのは); everything of this app's is prefixed hg_ (named for the
-- script, so a new name for the app changes nothing here), and nothing of ことのあめ (pl_), ことのおと (kn_), ことのは
-- (en_) or the old app is touched. Read and written from the browser as the learner (RLS: only their own row).
create table if not exists public.hg_records (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now(),
  -- The record keeps its newest 200 rains and 12 times per letter or word; this keeps the table from being used as storage.
  constraint hg_records_size check (pg_column_size(state) < 1048576)
);

alter table public.hg_records enable row level security;

drop policy if exists "hg_records own" on public.hg_records;
create policy "hg_records own" on public.hg_records
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
