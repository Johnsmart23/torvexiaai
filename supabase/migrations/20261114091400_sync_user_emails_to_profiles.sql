ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id
  AND p.email IS DISTINCT FROM u.email;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral_code TEXT;
  v_referred_by UUID;
  v_input_referral_code TEXT := NULLIF(upper(trim(NEW.raw_user_meta_data->>'referral_code')), '');
BEGIN
  IF v_input_referral_code IS NOT NULL THEN
    SELECT id INTO v_referred_by
    FROM public.profiles
    WHERE upper(referral_code) = v_input_referral_code
    LIMIT 1;
  END IF;

  LOOP
    v_referral_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE upper(referral_code) = v_referral_code
    );
  END LOOP;

  INSERT INTO public.profiles (
    user_id, full_name, phone, country, referral_code, referred_by, email
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'country'), ''),
    v_referral_code,
    v_referred_by,
    NEW.email
  );

  INSERT INTO public.wallets (user_id, wallet_type, balance) VALUES
    (NEW.id, 'deposit', 0),
    (NEW.id, 'active_investment', 0),
    (NEW.id, 'profit', 0),
    (NEW.id, 'referral', 0),
    (NEW.id, 'withdrawable', 0);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email
  WHERE user_id = NEW.id
    AND email IS DISTINCT FROM NEW.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_email_after_auth_update ON auth.users;
CREATE TRIGGER sync_profile_email_after_auth_update
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.sync_profile_email();
