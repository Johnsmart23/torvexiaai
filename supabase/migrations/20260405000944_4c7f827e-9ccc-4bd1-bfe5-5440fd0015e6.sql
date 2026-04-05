CREATE OR REPLACE FUNCTION public.admin_transfer_deposit_to_interest(
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
  v_deposit_balance numeric;
BEGIN
  IF NOT public.has_role(p_admin_id, 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  -- Lock deposit wallet
  SELECT balance INTO v_deposit_balance
  FROM wallets
  WHERE user_id = p_user_id AND wallet_type = 'deposit'
  FOR UPDATE;

  IF v_deposit_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Deposit wallet not found');
  END IF;

  IF v_deposit_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient deposit balance. Available: $' || v_deposit_balance::text);
  END IF;

  -- Deduct from deposit
  UPDATE wallets SET balance = balance - p_amount, updated_at = now()
  WHERE user_id = p_user_id AND wallet_type = 'deposit';

  -- Add to profit (interest) wallet
  UPDATE wallets SET balance = balance + p_amount, updated_at = now()
  WHERE user_id = p_user_id AND wallet_type = 'profit';

  -- Record debit transaction
  INSERT INTO transactions (user_id, wallet_type, transaction_type, amount, status, description, approved_by)
  VALUES (p_user_id, 'deposit', 'transfer', p_amount, 'completed',
    COALESCE(NULLIF(p_note, ''), 'Admin transfer: Deposit → Interest'), p_admin_id);

  -- Record credit transaction
  INSERT INTO transactions (user_id, wallet_type, transaction_type, amount, status, description, approved_by)
  VALUES (p_user_id, 'profit', 'transfer', p_amount, 'completed',
    COALESCE(NULLIF(p_note, ''), 'Admin transfer: Deposit → Interest'), p_admin_id);

  RETURN json_build_object('success', true, 'new_deposit_balance', v_deposit_balance - p_amount);
END;
$$;