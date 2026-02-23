
-- Investment status
CREATE TYPE public.investment_status AS ENUM ('active', 'completed', 'cancelled');

-- Investments table
CREATE TABLE public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  amount NUMERIC(18, 2) NOT NULL,
  daily_rate NUMERIC(5, 2) NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  days_completed INTEGER NOT NULL DEFAULT 0,
  total_profit_earned NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
  status investment_status NOT NULL DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trigger for updated_at
CREATE TRIGGER update_investments_updated_at
BEFORE UPDATE ON public.investments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own investments"
ON public.investments FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all investments"
ON public.investments FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all investments"
ON public.investments FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Index
CREATE INDEX idx_investments_user_id ON public.investments(user_id);
CREATE INDEX idx_investments_status ON public.investments(status);

-- Database function to process investment atomically
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
  v_investment_id UUID;
BEGIN
  -- Lock the deposit wallet row
  SELECT balance INTO v_deposit_balance
  FROM wallets
  WHERE user_id = p_user_id AND wallet_type = 'deposit'
  FOR UPDATE;

  IF v_deposit_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Deposit wallet not found');
  END IF;

  IF v_deposit_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance. You have $' || v_deposit_balance::TEXT);
  END IF;

  -- Deduct from deposit wallet
  UPDATE wallets SET balance = balance - p_amount
  WHERE user_id = p_user_id AND wallet_type = 'deposit';

  -- Add to active_investment wallet
  UPDATE wallets SET balance = balance + p_amount
  WHERE user_id = p_user_id AND wallet_type = 'active_investment';

  -- Create investment record
  INSERT INTO investments (user_id, plan_name, amount, daily_rate, duration_days, ends_at)
  VALUES (p_user_id, p_plan_name, p_amount, p_daily_rate, p_duration_days, now() + (p_duration_days || ' days')::interval)
  RETURNING id INTO v_investment_id;

  -- Create transaction for deposit deduction
  INSERT INTO transactions (user_id, wallet_type, transaction_type, amount, status, description)
  VALUES (p_user_id, 'deposit', 'investment', p_amount, 'completed', 'Invested in ' || p_plan_name || ' plan');

  -- Create transaction for active investment credit
  INSERT INTO transactions (user_id, wallet_type, transaction_type, amount, status, description)
  VALUES (p_user_id, 'active_investment', 'investment', p_amount, 'completed', p_plan_name || ' plan investment');

  RETURN json_build_object('success', true, 'investment_id', v_investment_id);
END;
$$;
