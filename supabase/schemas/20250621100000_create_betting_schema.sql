/* ------------------------------------------------------------
 *  betting schema
 *  - users           : Google 認証ユーザーのプロファイル
 *  - combinations    : 事前調査で確定した試合カード
 *  - bets_records    : 実際に行った賭けの履歴
 * ------------------------------------------------------------ */

-- ========== users ===========================================
create table public.users (
  -- auth.users に対応する UUID
  id uuid primary key references auth.users (id) on delete cascade,
  -- Google OAuth の sub（任意：必要なら）
  google_sub text unique,
  display_name text,
  created_at timestamp with time zone default now()
);
comment on table public.users is
  'アプリ利用者のプロフィール。auth.users と 1:1 で結合するラッパー';

-- RLS
alter table public.users enable row level security;
-- 自分の行のみ参照
create policy "read own profile"
on public.users
for select
to authenticated
using ( id = (select auth.uid()) );

-- 自分自身のプロファイルのみ作成可能
create policy "insert own profile"
on public.users
for insert
to authenticated
with check ( id = (select auth.uid()) );

-- 自分自身のプロファイルのみ更新可能
create policy "update own profile"
on public.users
for update
to authenticated
using ( id = (select auth.uid()) )
with check ( id = (select auth.uid()) );

-- ========== combinations ====================================
create table public.combinations (
  id serial primary key,
  monsters jsonb not null,                 -- [{name,victories,netOdds}, …]
  created_at timestamp with time zone default now()
);
comment on table public.combinations is
  'モンスターの組み合わせ。事前調査データ (monsterList.json) をそのまま格納';

-- 固定データを INSERT（以下は一例。monsterList.json 全件を INSERT してください）
-- insert into public.combinations (monsters) values
--   ('[{...}]'::jsonb), … ;

-- 公開読取のみ
alter table public.combinations enable row level security;
create policy "public read combinations"
on public.combinations
for select
to authenticated, anon
using ( true );

-- ========== bets_records ====================================
create table public.bets_records (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  combination_id int not null references public.combinations (id),
  outcome_monster_name text,  -- 勝利モンスター名 (NULL の場合は引き分け)
  is_draw boolean default false,
  -- ↓ベット実行時の入力スナップショット
  total_wealth numeric(18,2) not null,
  max_bet     numeric(18,2) not null,
  -- [{name,netOdds,betAmount,recommendedFraction}, …]
  bet_details jsonb not null,
  created_at timestamp with time zone default now()
);
comment on table public.bets_records is
  'ユーザーが実際に行った賭けの履歴。bet_details にモンスター個別の入力値を JSON で保持';

-- RLS
alter table public.bets_records enable row level security;

-- 自分のレコード読み書き
create policy "own bets read"
on public.bets_records
for select
to authenticated
using ( user_id = (select auth.uid()) );

create policy "own bets insert"
on public.bets_records
for insert
to authenticated
with check ( user_id = (select auth.uid()) );

create policy "own bets update"
on public.bets_records
for update
to authenticated
using ( user_id = (select auth.uid()) )
with check ( user_id = (select auth.uid()) );

create policy "own bets delete"
on public.bets_records
for delete
to authenticated
using ( user_id = (select auth.uid()) );

-- ===== インデックス（パフォーマンス） ======================
create index if not exists bets_records_user_id_idx
  on public.bets_records (user_id);

create index if not exists bets_records_comb_idx
  on public.bets_records (combination_id);
