GRANT SELECT ON public.investment_plans TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can view active plans" ON public.investment_plans;
DROP POLICY IF EXISTS "Public can view investment plans" ON public.investment_plans;

CREATE POLICY "Public can view investment plans"
  ON public.investment_plans FOR SELECT TO anon, authenticated
  USING (true);
