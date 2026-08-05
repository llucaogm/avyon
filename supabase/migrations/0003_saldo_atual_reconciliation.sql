-- Tracks when saldo_atual_conta was last confirmed by the user, so the app can
-- show a live balance (saldo_atual_conta + transações lançadas depois desse instante)
-- without requiring the user to manually update it every time.

alter table app_settings
  add column saldo_atual_em timestamptz not null default now();
