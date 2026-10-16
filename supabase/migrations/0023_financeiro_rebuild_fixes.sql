-- Banco recriado em 2026-10-16 no projeto rxwtkozerxahybnpefeg (o original foi
-- excluído pelo Supabase). Usuários que já existiam antes do gatilho não
-- receberam as linhas iniciais, e a função do gatilho não deve ser chamável
-- pela API.

insert into public.app_settings (user_id) select id from auth.users on conflict do nothing;
insert into public.emergency_fund_config (user_id) select id from auth.users on conflict do nothing;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
