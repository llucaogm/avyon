-- Avyon — Hábitos v2: água, peso, and the per-user habitos_config singleton
-- (goal for água). Also extends handle_new_user() so habitos_config gets
-- seeded on signup just like app_settings/emergency_fund_config already are.

create table habitos_config (
  user_id uuid primary key references auth.users(id) on delete cascade,
  meta_agua_ml integer not null default 2000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table agua_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data date not null default current_date,
  ml integer not null check (ml > 0),
  created_at timestamptz not null default now()
);
create index idx_agua_logs_user_data on agua_logs(user_id, data desc);

create table peso_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data date not null default current_date,
  peso_kg numeric(5,2) not null check (peso_kg > 0),
  created_at timestamptz not null default now()
);
create index idx_peso_logs_user_data on peso_logs(user_id, data desc);

alter table habitos_config enable row level security;
alter table agua_logs enable row level security;
alter table peso_logs enable row level security;

create policy "select own" on habitos_config for select using ((select auth.uid()) = user_id);
create policy "insert own" on habitos_config for insert with check ((select auth.uid()) = user_id);
create policy "update own" on habitos_config for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own" on habitos_config for delete using ((select auth.uid()) = user_id);

create policy "select own" on agua_logs for select using ((select auth.uid()) = user_id);
create policy "insert own" on agua_logs for insert with check ((select auth.uid()) = user_id);
create policy "update own" on agua_logs for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own" on agua_logs for delete using ((select auth.uid()) = user_id);

create policy "select own" on peso_logs for select using ((select auth.uid()) = user_id);
create policy "insert own" on peso_logs for insert with check ((select auth.uid()) = user_id);
create policy "update own" on peso_logs for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own" on peso_logs for delete using ((select auth.uid()) = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.app_settings (user_id) values (new.id);
  insert into public.emergency_fund_config (user_id) values (new.id);
  insert into public.habitos_config (user_id) values (new.id);
  return new;
end;
$$;

-- Backfill for users who signed up before this migration.
insert into habitos_config (user_id) select id from auth.users on conflict (user_id) do nothing;
