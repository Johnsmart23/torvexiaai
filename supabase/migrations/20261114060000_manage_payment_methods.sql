CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  asset TEXT NOT NULL,
  network TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  instructions TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO authenticated;
GRANT ALL ON public.payment_methods TO service_role;

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view active payment methods" ON public.payment_methods;
CREATE POLICY "Authenticated users can view active payment methods"
  ON public.payment_methods FOR SELECT TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can view all payment methods" ON public.payment_methods;
CREATE POLICY "Admins can view all payment methods"
  ON public.payment_methods FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert payment methods" ON public.payment_methods;
CREATE POLICY "Admins can insert payment methods"
  ON public.payment_methods FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update payment methods" ON public.payment_methods;
CREATE POLICY "Admins can update payment methods"
  ON public.payment_methods FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete payment methods" ON public.payment_methods;
CREATE POLICY "Admins can delete payment methods"
  ON public.payment_methods FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.payment_methods (name, asset, network, wallet_address)
SELECT 'USDT (TRC-20)', 'USDT', 'TRC-20 (Tron)', 'TXrZ1bDfhKJxMxkV5qWf3avREpSNBQPmfg'
WHERE NOT EXISTS (
  SELECT 1
  FROM public.payment_methods
  WHERE wallet_address = 'TXrZ1bDfhKJxMxkV5qWf3avREpSNBQPmfg'
);
