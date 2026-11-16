CREATE OR REPLACE FUNCTION public.admin_transfer_profit_to_withdrawable(
  p_admin_id uuid,
  p_user_id uuid,
  p_amount numeric,
  p_note text DEFAULT ''
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_profit_balance numeric;
  v_withdrawable_balance numeric;
  v_description text;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_admin_id
     OR NOT public.has_role(p_admin_id, 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF p_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User is required');
  END IF;

  IF p_amount IS NULL OR p_amount <= 0
     OR p_amount::text IN ('NaN', 'Infinity', '-Infinity') THEN
    RETURN json_build_object('success', false, 'error', 'Amount must be a positive finite number');
  END IF;

  SELECT balance INTO v_profit_balance
  FROM public.wallets
  WHERE user_id = p_user_id AND wallet_type = 'profit'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Profit wallet not found');
  END IF;

  SELECT balance INTO v_withdrawable_balance
  FROM public.wallets
  WHERE user_id = p_user_id AND wallet_type = 'withdrawable'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Withdrawable wallet not found');
  END IF;

  IF v_profit_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient profit balance');
  END IF;

  UPDATE public.wallets
  SET balance = balance - p_amount, updated_at = now()
  WHERE user_id = p_user_id AND wallet_type = 'profit';

  UPDATE public.wallets
  SET balance = balance + p_amount, updated_at = now()
  WHERE user_id = p_user_id AND wallet_type = 'withdrawable';

  v_description := COALESCE(NULLIF(BTRIM(p_note), ''), 'Wallet transfer');

  INSERT INTO public.transactions (user_id, wallet_type, transaction_type, amount, status, description, approved_by)
  VALUES (p_user_id, 'profit', 'transfer', p_amount, 'completed',
    'Admin transfer (Profit to Withdrawable): ' || v_description, p_admin_id);

  INSERT INTO public.transactions (user_id, wallet_type, transaction_type, amount, status, description, approved_by)
  VALUES (p_user_id, 'withdrawable', 'transfer', p_amount, 'completed',
    'Admin transfer (Profit to Withdrawable): ' || v_description, p_admin_id);

  RETURN json_build_object(
    'success', true,
    'profit_balance', v_profit_balance - p_amount,
    'withdrawable_balance', v_withdrawable_balance + p_amount
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_transfer_profit_to_withdrawable(uuid, uuid, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_transfer_profit_to_withdrawable(uuid, uuid, numeric, text) TO authenticated;
