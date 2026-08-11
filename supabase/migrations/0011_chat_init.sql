create type mensagem_role as enum ('user', 'assistant');

create table conversas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nota_id uuid references notas(id) on delete set null,
  titulo text not null default 'Nova conversa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table mensagens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversa_id uuid not null references conversas(id) on delete cascade,
  role mensagem_role not null,
  conteudo text not null,
  created_at timestamptz not null default now()
);

create index idx_conversas_user on conversas(user_id, updated_at desc);
create index idx_conversas_nota on conversas(nota_id);
create index idx_mensagens_conversa on mensagens(conversa_id, created_at);
create index idx_mensagens_user on mensagens(user_id);

alter table conversas enable row level security;
alter table mensagens enable row level security;

create policy "conversas_select" on conversas for select using ((select auth.uid()) = user_id);
create policy "conversas_insert" on conversas for insert with check ((select auth.uid()) = user_id);
create policy "conversas_update" on conversas for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "conversas_delete" on conversas for delete using ((select auth.uid()) = user_id);

create policy "mensagens_select" on mensagens for select using ((select auth.uid()) = user_id);
create policy "mensagens_insert" on mensagens for insert with check ((select auth.uid()) = user_id);
create policy "mensagens_update" on mensagens for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "mensagens_delete" on mensagens for delete using ((select auth.uid()) = user_id);
