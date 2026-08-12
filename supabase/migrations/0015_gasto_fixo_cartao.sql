alter table expense_categories add column cartao_id uuid references cartoes(id) on delete set null;
alter table income_categories add column cartao_id uuid references cartoes(id) on delete set null;

create index idx_expense_categories_cartao on expense_categories(cartao_id);
create index idx_income_categories_cartao on income_categories(cartao_id);
