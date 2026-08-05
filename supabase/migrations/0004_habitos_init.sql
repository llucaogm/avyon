-- Avyon — Hábitos module schema

create type habit_frequency as enum ('diaria', 'dias_da_semana');

create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  icone text,
  frequencia_tipo habit_frequency not null default 'diaria',
  dias_semana smallint[],
  ordem integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_habits_user on habits(user_id);

create table habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references habits(id) on delete cascade,
  data date not null default current_date,
  created_at timestamptz not null default now(),
  unique(habit_id, data)
);

create index idx_habit_logs_user_data on habit_logs(user_id, data desc);
create index idx_habit_logs_habit on habit_logs(habit_id, data desc);

alter table habits enable row level security;
alter table habit_logs enable row level security;

create policy "select own" on habits for select using ((select auth.uid()) = user_id);
create policy "insert own" on habits for insert with check ((select auth.uid()) = user_id);
create policy "update own" on habits for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own" on habits for delete using ((select auth.uid()) = user_id);

create policy "select own" on habit_logs for select using ((select auth.uid()) = user_id);
create policy "insert own" on habit_logs for insert with check ((select auth.uid()) = user_id);
create policy "update own" on habit_logs for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own" on habit_logs for delete using ((select auth.uid()) = user_id);
