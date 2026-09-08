-- Índices diretos nas próprias colunas de FK — os índices compostos
-- existentes (user_id, materia_id) / (user_id, cartao_id) não cobrem a FK
-- sozinha, que o Postgres usa pra JOIN/CASCADE. Achado pela skill
-- supabase-postgres-best-practices (schema-foreign-key-indexes).
create index if not exists notas_materia_id_idx on public.notas (materia_id);
create index if not exists transactions_cartao_id_idx on public.transactions (cartao_id);
