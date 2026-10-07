BEGIN;

-- 1. Grant SELECT on all columns to authenticated users
GRANT SELECT ON public.leads TO authenticated;

-- 2. Create RLS policy for Admins to view all leads
DROP POLICY IF EXISTS "admins_view_all_leads" ON public.leads;
CREATE POLICY "admins_view_all_leads" ON public.leads
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

COMMIT;
