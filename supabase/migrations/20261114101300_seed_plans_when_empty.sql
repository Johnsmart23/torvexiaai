INSERT INTO public.investment_plans (
  name,
  daily_rate,
  min_deposit,
  max_deposit,
  referral_bonus
)
SELECT defaults.name,
       defaults.daily_rate,
       defaults.min_deposit,
       defaults.max_deposit,
       defaults.referral_bonus
FROM (
  VALUES
    ('Bronze', 10::numeric, 10::numeric, 999::numeric, 3::numeric),
    ('Silver', 10::numeric, 50::numeric, 4999::numeric, 5::numeric),
    ('Gold', 10::numeric, 100::numeric, NULL::numeric, 7::numeric)
) AS defaults(name, daily_rate, min_deposit, max_deposit, referral_bonus)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.investment_plans
);
