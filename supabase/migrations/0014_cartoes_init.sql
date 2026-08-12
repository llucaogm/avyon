create type cartao_tipo as enum ('debito', 'credito');

create table cartoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  tipo cartao_tipo not null,
  cor text not null,
  limite numeric(12,2),
  saldo_reconciliado numeric(12,2) not null default 0,
  saldo_reconciliado_em timestamptz not null default now(),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table transactions add column cartao_id uuid references cartoes(id) on delete set null;

create index idx_cartoes_user on cartoes(user_id);
create index idx_transactions_cartao on transactions(user_id, cartao_id);

alter table cartoes enable row level security;
create policy "cartoes_select" on cartoes for select using ((select auth.uid()) = user_id);
create policy "cartoes_insert" on cartoes for insert with check ((select auth.uid()) = user_id);
create policy "cartoes_update" on cartoes for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "cartoes_delete" on cartoes for delete using ((select auth.uid()) = user_id);
