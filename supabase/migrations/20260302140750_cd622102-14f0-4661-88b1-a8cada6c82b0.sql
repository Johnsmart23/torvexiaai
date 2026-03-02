
-- 1. Create investment_plans table for admin CRUD
CREATE TABLE public.investment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  daily_rate numeric NOT NULL,
  min_deposit numeric NOT NULL DEFAULT 10,
  max_deposit numeric DEFAULT NULL,
  duration_days integer NOT NULL DEFAULT 30,
  referral_bonus numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;

-- Everyone can view active plans
CREATE POLICY "Anyone can view active plans" ON public.investment_plans
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Admins full access
CREATE POLICY "Admins full select on plans" ON public.investment_plans
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert plans" ON public.investment_plans
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update plans" ON public.investment_plans
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete plans" ON public.investment_plans
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_investment_plans_updated_at
  BEFORE UPDATE ON public.investment_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Seed default plans
INSERT INTO public.investment_plans (name, daily_rate, min_deposit, max_deposit, duration_days, referral_bonus) VALUES
  ('Bronze', 1, 10, 999, 30, 3),
  ('Silver', 2.5, 50, 4999, 30, 5),
  ('Gold', 4, 100, NULL, 30, 7);

-- 3. Add is_suspended to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false;

-- 4. Create function to auto-credit deposit wallet on admin approval
CREATE OR REPLACE FUNCTION public.approve_deposit(p_transaction_id uuid, p_admin_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tx RECORD;
BEGIN
  SELECT * INTO v_tx FROM transactions WHERE id = p_transaction_id AND status = 'pending' AND transaction_type = 'deposit';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Transaction not found or already processed');
  END IF;

  -- Update transaction status
  UPDATE transactions SET status = 'completed', approved_by = p_admin_id, updated_at = now()
  WHERE id = p_transaction_id;

  -- Credit the user's deposit wallet
  UPDATE wallets SET balance = balance + v_tx.amount, updated_at = now()
  WHERE user_id = v_tx.user_id AND wallet_type = 'deposit';

  RETURN json_build_object('success', true);
END;
$$;

-- 5. Create function to approve withdrawal (deduct from withdrawable wallet)
CREATE OR REPLACE FUNCTION public.approve_withdrawal(p_transaction_id uuid, p_admin_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tx RECORD;
  v_balance numeric;
BEGIN
  SELECT * INTO v_tx FROM transactions WHERE id = p_transaction_id AND status = 'pending' AND transaction_type = 'withdrawal';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Transaction not found or already processed');
  END IF;

  -- Check withdrawable balance
  SELECT balance INTO v_balance FROM wallets WHERE user_id = v_tx.user_id AND wallet_type = 'withdrawable' FOR UPDATE;

  IF v_balance < v_tx.amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient withdrawable balance');
  END IF;

  -- Update transaction
  UPDATE transactions SET status = 'completed', approved_by = p_admin_id, updated_at = now()
  WHERE id = p_transaction_id;

  -- Deduct from withdrawable wallet
  UPDATE wallets SET balance = balance - v_tx.amount, updated_at = now()
  WHERE user_id = v_tx.user_id AND wallet_type = 'withdrawable';

  RETURN json_build_object('success', true);
END;
$$;
