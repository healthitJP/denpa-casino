/*
 20250621121500_add_users_insert_update_policies.sql
 Purpose: Allow authenticated users to create and update their own profile rows in public.users to satisfy FK dependencies from bets_records.
*/

-- enable insert on own profile
create policy "insert own profile"
  on public.users
  for insert
  to authenticated
  with check ( id = (select auth.uid()) );

-- enable update on own profile
create policy "update own profile"
  on public.users
  for update
  to authenticated
  using ( id = (select auth.uid()) )
  with check ( id = (select auth.uid()) ); 