alter table expense_categories
  add column dia_vencimento smallint
  check (dia_vencimento is null or (dia_vencimento between 1 and 31));
