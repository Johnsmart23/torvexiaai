CREATE TABLE public.investment_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  profits_paused BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.investment_settings (id, profits_paused)
VALUES (1, false);

ALTER TABLE public.investment_settings ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.investment_settings TO authenticated;

CREATE POLICY "Authenticated users can view investment settings"
  ON public.investment_settings FOR SELECT TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.set_investment_profits_paused(p_paused BOOLEAN)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_paused BOOLEAN;
  v_pause_started_at TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Admin access required');
  END IF;

  SELECT profits_paused, updated_at
  INTO v_current_paused, v_pause_started_at
  FROM public.investment_settings
  WHERE id = 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Investment settings row is missing';
  END IF;

  IF v_current_paused IS DISTINCT FROM p_paused THEN
    UPDATE public.investment_settings
    SET profits_paused = p_paused,
        updated_at = now()
    WHERE id = 1;

    UPDATE public.investments
    SET last_interest_at = CASE
      WHEN p_paused THEN now()
      ELSE now() - interval '1 day'
    END,
    ends_at = CASE
      WHEN p_paused THEN ends_at
      ELSE ends_at + (now() - v_pause_started_at)
    END
    WHERE status = 'active'
      AND days_completed < duration_days;
  END IF;

  RETURN json_build_object('success', true, 'paused', p_paused);
END;
$$;

REVOKE ALL ON FUNCTION public.set_investment_profits_paused(BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_investment_profits_paused(BOOLEAN) TO authenticated;

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
BEGIN
  RETURN json_build_object(
    'success', false,
    'error', 'New investments are temporarily unavailable. You can still deposit funds from your dashboard.'
  );
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
  v_profits_paused BOOLEAN;
  v_interest NUMERIC(18, 2);
  v_next_day INTEGER;
  v_last_interest_at TIMESTAMPTZ;
  v_accrual_count INTEGER := 0;
  v_now TIMESTAMPTZ := now();
BEGIN
  SELECT profits_paused INTO v_profits_paused
  FROM public.investment_settings
  WHERE id = 1
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Investment settings row is missing';
  END IF;

  IF v_profits_paused THEN
    RETURN 0;
  END IF;

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
