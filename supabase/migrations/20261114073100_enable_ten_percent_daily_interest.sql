ALTER TABLE public.investments
  ADD COLUMN IF NOT EXISTS last_interest_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.investment_plans
SET daily_rate = 10
WHERE daily_rate IS DISTINCT FROM 10;

UPDATE public.investments
SET daily_rate = 10,
    last_interest_at = now(),
    ends_at = now() + GREATEST(duration_days - days_completed, 0) * interval '1 day'
WHERE status = 'active'
  AND days_completed < duration_days;

CREATE OR REPLACE FUNCTION public.process_investment(
  p_user_id UUID,
  p_plan_name TEXT,
  p_amount NUMERIC,
  p_daily_rate NUMERIC,
  p_duration_days INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deposit_balance NUMERIC;
  v_investment_balance NUMERIC;
  v_investment_id UUID;
  v_plan public.investment_plans%ROWTYPE;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RETURN json_build_object('success', false, 'error', 'You can only invest your own funds');
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Enter a valid investment amount');
  END IF;

  SELECT * INTO v_plan
  FROM public.investment_plans
  WHERE name = p_plan_name
    AND is_active = true
  ORDER BY created_at, id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'This investment plan is unavailable');
  END IF;

  IF p_amount < v_plan.min_deposit
     OR (v_plan.max_deposit IS NOT NULL AND p_amount > v_plan.max_deposit) THEN
    RETURN json_build_object('success', false, 'error', 'Investment amount is outside this plan''s limits');
  END IF;

  SELECT balance INTO v_deposit_balance
  FROM public.wallets
  WHERE user_id = p_user_id AND wallet_type = 'deposit'
  FOR UPDATE;

  IF v_deposit_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Deposit wallet not found');
  END IF;

  IF v_deposit_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient deposit wallet balance');
  END IF;

  SELECT balance INTO v_investment_balance
  FROM public.wallets
  WHERE user_id = p_user_id AND wallet_type = 'active_investment'
  FOR UPDATE;

  IF v_investment_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Investment wallet not found');
  END IF;

  UPDATE public.wallets
  SET balance = balance - p_amount
  WHERE user_id = p_user_id AND wallet_type = 'deposit';

  UPDATE public.wallets
  SET balance = balance + p_amount
  WHERE user_id = p_user_id AND wallet_type = 'active_investment';

  INSERT INTO public.investments (
    user_id, plan_name, amount, daily_rate, duration_days, ends_at, last_interest_at
  )
  VALUES (
    p_user_id,
    v_plan.name,
    p_amount,
    10,
    v_plan.duration_days,
    now() + (v_plan.duration_days || ' days')::interval,
    now()
  )
  RETURNING id INTO v_investment_id;

  INSERT INTO public.transactions (user_id, wallet_type, transaction_type, amount, status, description)
  VALUES
    (p_user_id, 'deposit', 'investment', p_amount, 'completed', 'Invested in ' || v_plan.name || ' plan'),
    (p_user_id, 'active_investment', 'investment', p_amount, 'completed', v_plan.name || ' plan investment');

  RETURN json_build_object('success', true, 'investment_id', v_investment_id);
END;
$$;

REVOKE ALL ON FUNCTION public.process_investment(UUID, TEXT, NUMERIC, NUMERIC, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.process_investment(UUID, TEXT, NUMERIC, NUMERIC, INTEGER) TO authenticated;

CREATE OR REPLACE FUNCTION public.accrue_daily_investment_interest()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_investment RECORD;
  v_interest NUMERIC(18, 2);
  v_next_day INTEGER;
  v_last_interest_at TIMESTAMPTZ;
  v_accrual_count INTEGER := 0;
  v_now TIMESTAMPTZ := now();
BEGIN
  FOR v_investment IN
    SELECT id, user_id, plan_name, amount, duration_days, days_completed, last_interest_at
    FROM public.investments
    WHERE status = 'active'
      AND days_completed < duration_days
      AND last_interest_at + interval '1 day' <= v_now
    ORDER BY last_interest_at, id
    FOR UPDATE SKIP LOCKED
  LOOP
    v_interest := round(v_investment.amount * 0.10, 2);
    v_next_day := v_investment.days_completed;
    v_last_interest_at := v_investment.last_interest_at;

    WHILE v_next_day < v_investment.duration_days
      AND v_last_interest_at + interval '1 day' <= v_now
    LOOP
      v_next_day := v_next_day + 1;
      v_last_interest_at := v_last_interest_at + interval '1 day';

      UPDATE public.wallets
      SET balance = balance + v_interest
      WHERE user_id = v_investment.user_id
        AND wallet_type = 'profit';

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Profit wallet missing for user %', v_investment.user_id;
      END IF;

      UPDATE public.investments
      SET daily_rate = 10,
          days_completed = v_next_day,
          total_profit_earned = total_profit_earned + v_interest,
          last_interest_at = v_last_interest_at,
          status = CASE
            WHEN v_next_day >= duration_days THEN 'completed'::public.investment_status
            ELSE 'active'::public.investment_status
          END
      WHERE id = v_investment.id;

      INSERT INTO public.transactions (
        user_id, wallet_type, transaction_type, amount, status, description
      )
      VALUES (
        v_investment.user_id,
        'profit',
        'profit',
        v_interest,
        'completed',
        'Day ' || v_next_day || ' of ' || v_investment.duration_days
          || ': 10% daily interest for ' || v_investment.plan_name || ' plan'
      );

      v_accrual_count := v_accrual_count + 1;
    END LOOP;
  END LOOP;

  RETURN v_accrual_count;
END;
$$;

REVOKE ALL ON FUNCTION public.accrue_daily_investment_interest() FROM PUBLIC, anon, authenticated;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'daily-investment-interest';

SELECT cron.schedule(
  'daily-investment-interest',
  '5 0 * * *',
  'SELECT public.accrue_daily_investment_interest();'
);
