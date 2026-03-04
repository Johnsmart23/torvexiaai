
CREATE OR REPLACE FUNCTION public.admin_transfer_to_user(p_admin_id uuid, p_user_id uuid, p_amount numeric, p_note text DEFAULT ''::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company_balance numeric;
  v_wallet_id uuid;
BEGIN
  IF NOT public.has_role(p_admin_id, 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  SELECT balance INTO v_company_balance FROM company_wallet LIMIT 1 FOR UPDATE;
  
  IF v_company_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Company wallet not found');
  END IF;

  IF v_company_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient company balance');
  END IF;

  UPDATE company_wallet SET balance = balance - p_amount, updated_at = now()
  WHERE id = (SELECT id FROM company_wallet LIMIT 1);

  SELECT id INTO v_wallet_id FROM wallets WHERE user_id = p_user_id AND wallet_type = 'deposit';
  
  IF v_wallet_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User deposit wallet not found');
  END IF;

  UPDATE wallets SET balance = balance + p_amount, updated_at = now()
  WHERE id = v_wallet_id;

  INSERT INTO transactions (user_id, wallet_type, transaction_type, amount, status, description, approved_by)
  VALUES (p_user_id, 'deposit', 'transfer', p_amount, 'completed', 
    COALESCE(NULLIF(p_note, ''), 'Admin transfer'), p_admin_id);

  RETURN json_build_object('success', true, 'new_company_balance', v_company_balance - p_amount);
END;
$function$;

CREATE OR REPLACE FUNCTION public.approve_deposit(p_transaction_id uuid, p_admin_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tx RECORD;
  v_company_balance numeric;
BEGIN
  SELECT * INTO v_tx FROM transactions WHERE id = p_transaction_id AND status = 'pending' AND transaction_type = 'deposit';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Transaction not found or already processed');
  END IF;

  SELECT balance INTO v_company_balance FROM company_wallet LIMIT 1 FOR UPDATE;
  IF v_company_balance < v_tx.amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient company balance');
  END IF;

  UPDATE company_wallet SET balance = balance - v_tx.amount, updated_at = now()
  WHERE id = (SELECT id FROM company_wallet LIMIT 1);

  UPDATE transactions SET status = 'completed', approved_by = p_admin_id, updated_at = now()
  WHERE id = p_transaction_id;

  UPDATE wallets SET balance = balance + v_tx.amount, updated_at = now()
  WHERE user_id = v_tx.user_id AND wallet_type = 'deposit';

  RETURN json_build_object('success', true);
END;
$function$;
