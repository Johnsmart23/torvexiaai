CREATE OR REPLACE FUNCTION public.admin_activate_user_investment(
  p_user_id UUID,
  p_plan_id UUID,
  p_amount NUMERIC
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan public.investment_plans%ROWTYPE;
  v_is_suspended BOOLEAN;
  v_deposit_balance NUMERIC(18, 2);
  v_investment_balance NUMERIC(18, 2);
  v_investment_id UUID;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Admin access required');
  END IF;

  IF p_user_id IS NULL OR p_plan_id IS NULL
     OR p_amount IS NULL OR p_amount <= 0 OR p_amount <> round(p_amount, 2) THEN
    RETURN json_build_object('success', false, 'error', 'Enter a valid user, plan, and amount');
  END IF;

  SELECT is_suspended INTO v_is_suspended
  FROM public.profiles
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User account not found');
  END IF;

  IF v_is_suspended THEN
    RETURN json_build_object('success', false, 'error', 'Cannot activate a plan for a suspended user');
  END IF;

  SELECT * INTO v_plan
  FROM public.investment_plans
  WHERE id = p_plan_id AND is_active = true;

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

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User deposit wallet not found');
  END IF;

  IF v_deposit_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient deposit wallet balance');
  END IF;

  SELECT balance INTO v_investment_balance
  FROM public.wallets
  WHERE user_id = p_user_id AND wallet_type = 'active_investment'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User investment wallet not found');
  END IF;

  UPDATE public.wallets
  SET balance = balance - p_amount
  WHERE user_id = p_user_id AND wallet_type = 'deposit';

  UPDATE public.wallets
  SET balance = balance + p_amount
  WHERE user_id = p_user_id AND wallet_type = 'active_investment';

  INSERT INTO public.investments (user_id, plan_name, amount, daily_rate, last_interest_at)
  VALUES (p_user_id, v_plan.name, p_amount, 10, now())
  RETURNING id INTO v_investment_id;

  INSERT INTO public.transactions (
    user_id, wallet_type, transaction_type, amount, status, description, approved_by
  )
  VALUES
    (p_user_id, 'deposit', 'investment', p_amount, 'completed',
     'Admin activated ' || v_plan.name || ' plan using deposit wallet funds', auth.uid()),
    (p_user_id, 'active_investment', 'investment', p_amount, 'completed',
     v_plan.name || ' plan investment activated by admin', auth.uid());

  RETURN json_build_object('success', true, 'investment_id', v_investment_id);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_activate_user_investment(UUID, UUID, NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_activate_user_investment(UUID, UUID, NUMERIC) TO authenticated;
