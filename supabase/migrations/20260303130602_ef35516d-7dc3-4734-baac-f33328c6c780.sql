
-- Company wallet table (single row for company funds)
CREATE TABLE public.company_wallet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  balance numeric NOT NULL DEFAULT 0.00,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_wallet ENABLE ROW LEVEL SECURITY;

-- Only admins can view/update company wallet
CREATE POLICY "Admins can view company wallet" ON public.company_wallet
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update company wallet" ON public.company_wallet
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed with $1,000,000
INSERT INTO public.company_wallet (balance) VALUES (1000000.00);

-- Function: admin transfers funds to a user's deposit wallet
CREATE OR REPLACE FUNCTION public.admin_transfer_to_user(
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
  v_company_balance numeric;
BEGIN
  -- Verify admin
  IF NOT public.has_role(p_admin_id, 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  -- Lock and check company balance
  SELECT balance INTO v_company_balance FROM company_wallet FOR UPDATE;
  
  IF v_company_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Company wallet not found');
  END IF;

  IF v_company_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient company balance');
  END IF;

  -- Debit company wallet
  UPDATE company_wallet SET balance = balance - p_amount, updated_at = now();

  -- Credit user deposit wallet
  UPDATE wallets SET balance = balance + p_amount, updated_at = now()
  WHERE user_id = p_user_id AND wallet_type = 'deposit';

  -- Record transaction
  INSERT INTO transactions (user_id, wallet_type, transaction_type, amount, status, description, approved_by)
  VALUES (p_user_id, 'deposit', 'deposit', p_amount, 'completed', 
    COALESCE(NULLIF(p_note, ''), 'Admin transfer'), p_admin_id);

  RETURN json_build_object('success', true, 'new_company_balance', v_company_balance - p_amount);
END;
$$;

-- Update approve_deposit to also debit company wallet
CREATE OR REPLACE FUNCTION public.approve_deposit(p_transaction_id uuid, p_admin_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tx RECORD;
  v_company_balance numeric;
BEGIN
  SELECT * INTO v_tx FROM transactions WHERE id = p_transaction_id AND status = 'pending' AND transaction_type = 'deposit';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Transaction not found or already processed');
  END IF;

  -- Lock and check company balance
  SELECT balance INTO v_company_balance FROM company_wallet FOR UPDATE;
  IF v_company_balance < v_tx.amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient company balance');
  END IF;

  -- Debit company wallet
  UPDATE company_wallet SET balance = balance - v_tx.amount, updated_at = now();

  -- Update transaction status
  UPDATE transactions SET status = 'completed', approved_by = p_admin_id, updated_at = now()
  WHERE id = p_transaction_id;

  -- Credit the user's deposit wallet
  UPDATE wallets SET balance = balance + v_tx.amount, updated_at = now()
  WHERE user_id = v_tx.user_id AND wallet_type = 'deposit';

  RETURN json_build_object('success', true);
END;
$$;
