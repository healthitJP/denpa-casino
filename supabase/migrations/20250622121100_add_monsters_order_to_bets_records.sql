/* ------------------------------------------------------------
 * add monsters_order column to bets_records
 * ------------------------------------------------------------ */
alter table public.bets_records
  add column if not exists monsters_order int[];

comment on column public.bets_records.monsters_order is
  'combination.monsters のインデックス順を保持する配列。{0,1,2} 等';