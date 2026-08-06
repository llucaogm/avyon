-- Avyon — let a Gasto Fixo / Receita Fixa carry its own default Categoria,
-- so the one-click "Confirmar pagamento/recebimento" flow (and QuickAdd,
-- when that Gasto Fixo is picked) can auto-tag the resulting transaction
-- instead of always landing in "Sem categoria".

alter table expense_categories add column categoria_id uuid references categorias(id) on delete set null;
alter table income_categories add column categoria_id uuid references categorias(id) on delete set null;
create index idx_expense_categories_categoria on expense_categories(categoria_id);
create index idx_income_categories_categoria on income_categories(categoria_id);
