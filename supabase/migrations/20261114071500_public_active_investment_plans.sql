GRANT SELECT ON public.investment_plans TO anon;

DROP POLICY IF EXISTS "Anyone can view active plans" ON public.investment_plans;
CREATE POLICY "Anyone can view active plans"
  ON public.investment_plans FOR SELECT TO anon, authenticated
  USING (is_active = true);
