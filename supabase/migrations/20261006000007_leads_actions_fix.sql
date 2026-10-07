-- 20261006000007_leads_actions_fix.sql
-- Allow customers to complete a lead even if it is still in 'open' status (e.g. only 1 or 2 responses).

CREATE OR REPLACE FUNCTION public.complete_lead(p_lead_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.leads 
  SET status = 'completed' 
  WHERE id = p_lead_id AND customer_id = auth.uid() AND status IN ('claimed', 'open');
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found, not owned by you, or not in open/claimed state';
  END IF;

  RETURN TRUE;
END;
$$;
