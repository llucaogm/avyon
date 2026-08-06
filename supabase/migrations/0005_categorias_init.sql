-- Avyon — Categorias (real spend/income tagging, separate from Gastos Fixos/Receitas Fixas)

create type categoria_tipo as enum ('despesa', 'receita');

create table categorias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo categoria_tipo not null,
  nome text not null,
  cor text not null,
  ordem integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_categorias_user_tipo on categorias(user_id, tipo);

alter table categorias enable row level security;

create policy "select own" on categorias for select using ((select auth.uid()) = user_id);
create policy "insert own" on categorias for insert with check ((select auth.uid()) = user_id);
create policy "update own" on categorias for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own" on categorias for delete using ((select auth.uid()) = user_id);

alter table transactions add column categoria_id uuid references categorias(id) on delete set null;
create index idx_transactions_categoria on transactions(categoria_id);
