-- Wrap auth.uid() in a subselect so it's evaluated once per query, not once per row
-- (fixes auth_rls_initplan advisories across every table).

drop policy "select own" on app_settings;
drop policy "insert own" on app_settings;
drop policy "update own" on app_settings;
drop policy "delete own" on app_settings;
create policy "select own" on app_settings for select using ((select auth.uid()) = user_id);
create policy "insert own" on app_settings for insert with check ((select auth.uid()) = user_id);
create policy "update own" on app_settings for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own" on app_settings for delete using ((select auth.uid()) = user_id);

drop policy "select own" on expense_categories;
drop policy "insert own" on expense_categories;
drop policy "update own" on expense_categories;
drop policy "delete own" on expense_categories;
create policy "select own" on expense_categories for select using ((select auth.uid()) = user_id);
create policy "insert own" on expense_categories for insert with check ((select auth.uid()) = user_id);
create policy "update own" on expense_categories for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own" on expense_categories for delete using ((select auth.uid()) = user_id);

drop policy "select own" on income_categories;
drop policy "insert own" on income_categories;
drop policy "update own" on income_categories;
drop policy "delete own" on income_categories;
create policy "select own" on income_categories for select using ((select auth.uid()) = user_id);
create policy "insert own" on income_categories for insert with check ((select auth.uid()) = user_id);
create policy "update own" on income_categories for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own" on income_categories for delete using ((select auth.uid()) = user_id);

drop policy "select own" on transactions;
drop policy "insert own" on transactions;
drop policy "update own" on transactions;
drop policy "delete own" on transactions;
create policy "select own" on transactions for select using ((select auth.uid()) = user_id);
create policy "insert own" on transactions for insert with check ((select auth.uid()) = user_id);
create policy "update own" on transactions for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own" on transactions for delete using ((select auth.uid()) = user_id);

drop policy "select own" on category_month_status;
drop policy "insert own" on category_month_status;
drop policy "update own" on category_month_status;
drop policy "delete own" on category_month_status;
create policy "select own" on category_month_status for select using ((select auth.uid()) = user_id);
create policy "insert own" on category_month_status for insert with check ((select auth.uid()) = user_id);
create policy "update own" on category_month_status for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own" on category_month_status for delete using ((select auth.uid()) = user_id);

drop policy "select own" on emergency_fund_config;
drop policy "insert own" on emergency_fund_config;
drop policy "update own" on emergency_fund_config;
drop policy "delete own" on emergency_fund_config;
create policy "select own" on emergency_fund_config for select using ((select auth.uid()) = user_id);
create policy "insert own" on emergency_fund_config for insert with check ((select auth.uid()) = user_id);
create policy "update own" on emergency_fund_config for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own" on emergency_fund_config for delete using ((select auth.uid()) = user_id);

drop policy "select own" on emergency_fund_contributions;
drop policy "insert own" on emergency_fund_contributions;
drop policy "update own" on emergency_fund_contributions;
drop policy "delete own" on emergency_fund_contributions;
create policy "select own" on emergency_fund_contributions for select using ((select auth.uid()) = user_id);
create policy "insert own" on emergency_fund_contributions for insert with check ((select auth.uid()) = user_id);
create policy "update own" on emergency_fund_contributions for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own" on emergency_fund_contributions for delete using ((select auth.uid()) = user_id);

drop policy "select own" on goals;
drop policy "insert own" on goals;
drop policy "update own" on goals;
drop policy "delete own" on goals;
create policy "select own" on goals for select using ((select auth.uid()) = user_id);
create policy "insert own" on goals for insert with check ((select auth.uid()) = user_id);
create policy "update own" on goals for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own" on goals for delete using ((select auth.uid()) = user_id);

drop policy "select own" on goal_contributions;
drop policy "insert own" on goal_contributions;
drop policy "update own" on goal_contributions;
drop policy "delete own" on goal_contributions;
create policy "select own" on goal_contributions for select using ((select auth.uid()) = user_id);
create policy "insert own" on goal_contributions for insert with check ((select auth.uid()) = user_id);
create policy "update own" on goal_contributions for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own" on goal_contributions for delete using ((select auth.uid()) = user_id);

-- Cover foreign keys flagged by the performance advisor.
create index idx_goal_contributions_user on goal_contributions(user_id);
create index idx_transactions_expense_category on transactions(expense_category_id);
create index idx_transactions_income_category on transactions(income_category_id);
