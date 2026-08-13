create type post_plataforma as enum ('instagram', 'tiktok', 'youtube', 'linkedin', 'outro');
create type post_tipo as enum ('estatico', 'carrossel', 'reels', 'video', 'stories');
create type post_status as enum ('ideia', 'roteiro', 'gravacao', 'edicao', 'agendado', 'publicado');

create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null,
  plataforma post_plataforma not null default 'instagram',
  tipo post_tipo not null default 'reels',
  status post_status not null default 'ideia',
  data_publicacao date,
  legenda text,
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table roteiros (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid references posts(id) on delete set null,
  titulo text not null,
  blocos jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table referencias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid references posts(id) on delete set null,
  titulo text not null,
  url text,
  tipo text,
  cor text not null,
  observacao text,
  created_at timestamptz not null default now()
);

create table ideias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conteudo text not null,
  created_at timestamptz not null default now()
);

create index idx_posts_user on posts(user_id, data_publicacao);
create index idx_roteiros_user on roteiros(user_id);
create index idx_roteiros_post on roteiros(post_id);
create index idx_referencias_user on referencias(user_id);
create index idx_referencias_post on referencias(post_id);
create index idx_ideias_user on ideias(user_id, created_at desc);

alter table posts enable row level security;
create policy "posts_select" on posts for select using ((select auth.uid()) = user_id);
create policy "posts_insert" on posts for insert with check ((select auth.uid()) = user_id);
create policy "posts_update" on posts for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "posts_delete" on posts for delete using ((select auth.uid()) = user_id);

alter table roteiros enable row level security;
create policy "roteiros_select" on roteiros for select using ((select auth.uid()) = user_id);
create policy "roteiros_insert" on roteiros for insert with check ((select auth.uid()) = user_id);
create policy "roteiros_update" on roteiros for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "roteiros_delete" on roteiros for delete using ((select auth.uid()) = user_id);

alter table referencias enable row level security;
create policy "referencias_select" on referencias for select using ((select auth.uid()) = user_id);
create policy "referencias_insert" on referencias for insert with check ((select auth.uid()) = user_id);
create policy "referencias_update" on referencias for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "referencias_delete" on referencias for delete using ((select auth.uid()) = user_id);

alter table ideias enable row level security;
create policy "ideias_select" on ideias for select using ((select auth.uid()) = user_id);
create policy "ideias_insert" on ideias for insert with check ((select auth.uid()) = user_id);
create policy "ideias_update" on ideias for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "ideias_delete" on ideias for delete using ((select auth.uid()) = user_id);
