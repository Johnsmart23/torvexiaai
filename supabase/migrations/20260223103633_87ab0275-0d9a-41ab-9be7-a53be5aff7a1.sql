
-- Wallet type enum
CREATE TYPE public.wallet_type AS ENUM ('deposit', 'active_investment', 'profit', 'referral', 'withdrawable');

-- Transaction type enum
CREATE TYPE public.transaction_type AS ENUM ('deposit', 'withdrawal', 'investment', 'profit', 'referral_bonus', 'capital_return', 'transfer');

-- Transaction status enum
CREATE TYPE public.transaction_status AS ENUM ('pending', 'completed', 'rejected', 'cancelled');

-- Wallets table: one row per user per wallet type
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_type wallet_type NOT NULL,
  balance NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, wallet_type)
);

-- Transactions table: immutable ledger of all balance changes
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_type wallet_type NOT NULL,
  transaction_type transaction_type NOT NULL,
  amount NUMERIC(18, 2) NOT NULL,
  status transaction_status NOT NULL DEFAULT 'pending',
  description TEXT,
  admin_note TEXT,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trigger for updated_at on wallets
CREATE TRIGGER update_wallets_updated_at
BEFORE UPDATE ON public.wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on transactions
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create 5 wallets when a user signs up
CREATE OR REPLACE FUNCTION public.create_user_wallets()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.wallets (user_id, wallet_type) VALUES
    (NEW.id, 'deposit'),
    (NEW.id, 'active_investment'),
    (NEW.id, 'profit'),
    (NEW.id, 'referral'),
    (NEW.id, 'withdrawable');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_wallets
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_user_wallets();

-- RLS for wallets
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallets"
ON public.wallets FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets"
ON public.wallets FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all wallets"
ON public.wallets FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS for transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
ON public.transactions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
ON public.transactions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
ON public.transactions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all transactions"
ON public.transactions FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert transactions"
ON public.transactions FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
