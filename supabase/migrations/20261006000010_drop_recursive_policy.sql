-- 20261006000010_drop_recursive_policy.sql
-- Drop the recursive policy from 0008, as per user request we don't need it.

DROP POLICY IF EXISTS "Customers can view respondents" ON public.craftsmen;
