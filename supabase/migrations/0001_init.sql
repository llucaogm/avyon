-- Controle Financeiro — initial schema
-- Enums

create type category_group as enum ('fixo', 'variavel', 'objetivo', 'reserva');
create type expense_frequency as enum ('mensal', 'anual', 'semestral', 'unico');
create type income_recurrence as enum ('mensal', 'anual', 'semestral', 'eventual');

-- app_settings (1 row per user)

create table app_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  saldo_atual_conta numeric(12,2) not null default 0,
  limite_alerta_percentual numeric(5,2) not null default 20,
  renda_liquida_override numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- expense_categories

create table expense_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  valor_mensal numeric(12,2) not null default 0,
  grupo category_group not null,
  frequencia expense_frequency not null default 'mensal',
  due_month smallint check (due_month between 1 and 12),
  charge_date date,
  end_date date,
  observacao text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_expense_categories_user on expense_categories(user_id);

-- income_categories

create table income_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  valor_mensal numeric(12,2) not null default 0,
  recorrencia income_recurrence not null default 'mensal',
  observacao text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_income_categories_user on income_categories(user_id);

-- transactions (Checagem Diária)

create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data date not null default current_date,
  descricao text not null,
  valor_entrada numeric(12,2) not null default 0,
  valor_saida numeric(12,2) not null default 0,
  expense_category_id uuid references expense_categories(id) on delete set null,
  income_category_id uuid references income_categories(id) on delete set null,
  forma_pagamento text,
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_transactions_single_direction check (
    (valor_entrada > 0 and valor_saida = 0) or (valor_saida > 0 and valor_entrada = 0)
  )
);

create index idx_transactions_user_data on transactions(user_id, data desc);
create index idx_transactions_user_expense_cat on transactions(user_id, expense_category_id);

-- category_month_status (Gastos Mensais "Pago?" + observação mensal)

create table category_month_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references expense_categories(id) on delete cascade,
  year_month date not null,
  pago boolean not null default false,
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(category_id, year_month)
);

create index idx_category_month_status_user on category_month_status(user_id, year_month);

-- emergency_fund_config (1 row per user)

create table emergency_fund_config (
  user_id uuid primary key references auth.users(id) on delete cascade,
  gastos_mensais_essenciais numeric(12,2) not null default 0,
  meses_reserva_desejados numeric(5,2) not null default 6,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- emergency_fund_contributions

create table emergency_fund_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mes date not null,
  aporte numeric(12,2) not null,
  observacao text,
  created_at timestamptz not null default now()
);

create index idx_emergency_fund_contributions_user on emergency_fund_contributions(user_id, mes);

-- goals (Objetivos)

create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  valor_total numeric(12,2) not null,
  prazo_meses integer not null,
  status text not null default 'ativo' check (status in ('ativo', 'concluido', 'cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_goals_user on goals(user_id);

-- goal_contributions

create table goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references goals(id) on delete cascade,
  valor numeric(12,2) not null,
  data date not null default current_date,
  observacao text,
  created_at timestamptz not null default now()
);

create index idx_goal_contributions_goal on goal_contributions(goal_id);

-- Row Level Security: every table is isolated per user via auth.uid()

alter table app_settings enable row level security;
alter table expense_categories enable row level security;
alter table income_categories enable row level security;
alter table transactions enable row level security;
alter table category_month_status enable row level security;
alter table emergency_fund_config enable row level security;
alter table emergency_fund_contributions enable row level security;
alter table goals enable row level security;
alter table goal_contributions enable row level security;

create policy "select own" on app_settings for select using (auth.uid() = user_id);
create policy "insert own" on app_settings for insert with check (auth.uid() = user_id);
create policy "update own" on app_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own" on app_settings for delete using (auth.uid() = user_id);

create policy "select own" on expense_categories for select using (auth.uid() = user_id);
create policy "insert own" on expense_categories for insert with check (auth.uid() = user_id);
create policy "update own" on expense_categories for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own" on expense_categories for delete using (auth.uid() = user_id);

create policy "select own" on income_categories for select using (auth.uid() = user_id);
create policy "insert own" on income_categories for insert with check (auth.uid() = user_id);
create policy "update own" on income_categories for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own" on income_categories for delete using (auth.uid() = user_id);

create policy "select own" on transactions for select using (auth.uid() = user_id);
create policy "insert own" on transactions for insert with check (auth.uid() = user_id);
create policy "update own" on transactions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own" on transactions for delete using (auth.uid() = user_id);

create policy "select own" on category_month_status for select using (auth.uid() = user_id);
create policy "insert own" on category_month_status for insert with check (auth.uid() = user_id);
create policy "update own" on category_month_status for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own" on category_month_status for delete using (auth.uid() = user_id);

create policy "select own" on emergency_fund_config for select using (auth.uid() = user_id);
create policy "insert own" on emergency_fund_config for insert with check (auth.uid() = user_id);
create policy "update own" on emergency_fund_config for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own" on emergency_fund_config for delete using (auth.uid() = user_id);

create policy "select own" on emergency_fund_contributions for select using (auth.uid() = user_id);
create policy "insert own" on emergency_fund_contributions for insert with check (auth.uid() = user_id);
create policy "update own" on emergency_fund_contributions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own" on emergency_fund_contributions for delete using (auth.uid() = user_id);

create policy "select own" on goals for select using (auth.uid() = user_id);
create policy "insert own" on goals for insert with check (auth.uid() = user_id);
create policy "update own" on goals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own" on goals for delete using (auth.uid() = user_id);

create policy "select own" on goal_contributions for select using (auth.uid() = user_id);
create policy "insert own" on goal_contributions for insert with check (auth.uid() = user_id);
create policy "update own" on goal_contributions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own" on goal_contributions for delete using (auth.uid() = user_id);

-- New-user provisioning: every signup starts with sane, zeroed defaults

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.app_settings (user_id) values (new.id);
  insert into public.emergency_fund_config (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
