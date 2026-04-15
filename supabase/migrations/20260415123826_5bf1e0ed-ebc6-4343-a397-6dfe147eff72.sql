
-- Update handle_new_user to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, referral_code, referred_by, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'referral_code', NULL),
    NULL,
    NEW.email
  );
  INSERT INTO public.wallets (user_id, wallet_type, balance) VALUES
    (NEW.id, 'deposit', 0),
    (NEW.id, 'active_investment', 0),
    (NEW.id, 'profit', 0),
    (NEW.id, 'referral', 0),
    (NEW.id, 'withdrawable', 0);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

-- Backfill email for existing profiles
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND p.email IS NULL;
