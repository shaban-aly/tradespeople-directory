-- Migration: Security fixes for unauthorized access and stats tampering

-- 1. Remove the test function that leaks admin users and emails to anon
DROP FUNCTION IF EXISTS public.get_admin_users_test();

-- 2. Remove the outdated/unprotected increment_craftsman_stats that takes uuid and text
-- The active version takes (p_slug text, p_action text, p_ip text, p_user_id uuid, p_user_status text)
DROP FUNCTION IF EXISTS public.increment_craftsman_stats(uuid, text);

-- 3. Remove the policy that allows craftsmen to modify their own stats
-- Stats should only be modified via the increment_craftsman_stats RPC (which is SECURITY DEFINER)
DROP POLICY IF EXISTS "Users can update stats of their owned craftsmen" ON public.craftsman_stats;
