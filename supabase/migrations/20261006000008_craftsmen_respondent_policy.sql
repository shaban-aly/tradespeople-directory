-- 20261006000008_craftsmen_respondent_policy.sql
-- Allow customers to view the craftsmen who have responded to their leads, 
-- even if the craftsman is not currently 'published'.

CREATE POLICY "Customers can view respondents" 
  ON public.craftsmen FOR SELECT 
  TO authenticated
  USING (
    id IN (
      SELECT lr.craftsman_id 
      FROM public.lead_responses lr
      JOIN public.leads l ON l.id = lr.lead_id
      WHERE l.customer_id = auth.uid()
    )
  );
