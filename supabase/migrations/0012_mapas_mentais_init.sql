create table mapas_mentais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null,
  nota_ids uuid[] not null default '{}',
  conteudo jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_mapas_mentais_user on mapas_mentais(user_id, updated_at desc);

alter table mapas_mentais enable row level security;

create policy "mapas_mentais_select" on mapas_mentais for select using ((select auth.uid()) = user_id);
create policy "mapas_mentais_insert" on mapas_mentais for insert with check ((select auth.uid()) = user_id);
create policy "mapas_mentais_update" on mapas_mentais for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "mapas_mentais_delete" on mapas_mentais for delete using ((select auth.uid()) = user_id);
