create table consultas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null,
  descricao text,
  html text not null,
  materia_id uuid references materias(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_consultas_user on consultas(user_id, updated_at desc);
create index idx_consultas_materia on consultas(materia_id);

alter table consultas enable row level security;
create policy "consultas_select" on consultas for select using ((select auth.uid()) = user_id);
create policy "consultas_insert" on consultas for insert with check ((select auth.uid()) = user_id);
create policy "consultas_update" on consultas for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "consultas_delete" on consultas for delete using ((select auth.uid()) = user_id);
