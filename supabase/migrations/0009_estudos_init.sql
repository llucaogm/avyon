create type study_color as enum ('teal', 'blue', 'amber', 'rose', 'violet', 'green');
create type nota_tipo as enum ('rascunho', 'livro', 'artigo', 'video', 'aula', 'podcast', 'ideia');

create table materias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  cor study_color not null default 'teal',
  created_at timestamptz not null default now()
);

create table notas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  materia_id uuid references materias(id) on delete set null,
  titulo text not null,
  tipo nota_tipo not null default 'rascunho',
  fonte text,
  url text,
  cor study_color not null default 'amber',
  conteudo text,
  chaves text[] not null default '{}',
  resumo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_notas_user_materia on notas(user_id, materia_id);

alter table materias enable row level security;
alter table notas enable row level security;

create policy "materias_select" on materias for select using ((select auth.uid()) = user_id);
create policy "materias_insert" on materias for insert with check ((select auth.uid()) = user_id);
create policy "materias_update" on materias for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "materias_delete" on materias for delete using ((select auth.uid()) = user_id);

create policy "notas_select" on notas for select using ((select auth.uid()) = user_id);
create policy "notas_insert" on notas for insert with check ((select auth.uid()) = user_id);
create policy "notas_update" on notas for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "notas_delete" on notas for delete using ((select auth.uid()) = user_id);
