ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.account_auth_email_limits (
  recipient_hash TEXT NOT NULL,
  action TEXT NOT NULL,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (recipient_hash, action)
);

ALTER TABLE public.account_auth_email_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.account_auth_email_limits FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.consume_account_auth_email_limit(
  p_recipient_hash TEXT,
  p_action TEXT,
  p_max_requests INTEGER,
  p_window_seconds INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF p_recipient_hash IS NULL OR p_action IS NULL OR p_max_requests < 1 OR p_window_seconds < 1 THEN
    RETURN false;
  END IF;

  INSERT INTO public.account_auth_email_limits (
    recipient_hash, action, window_started_at, request_count
  )
  VALUES (p_recipient_hash, p_action, now(), 1)
  ON CONFLICT (recipient_hash, action) DO UPDATE
  SET request_count = CASE
        WHEN account_auth_email_limits.window_started_at
          <= now() - make_interval(secs => p_window_seconds) THEN 1
        ELSE account_auth_email_limits.request_count + 1
      END,
      window_started_at = CASE
        WHEN account_auth_email_limits.window_started_at
          <= now() - make_interval(secs => p_window_seconds) THEN now()
        ELSE account_auth_email_limits.window_started_at
      END
  RETURNING request_count INTO v_count;

  RETURN v_count <= p_max_requests;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_account_auth_email_limit(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_account_auth_email_limit(TEXT, TEXT, INTEGER, INTEGER) TO service_role;

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
      SELECT 1 FROM public.profiles WHERE upper(referral_code) = v_referral_code
    );
  END LOOP;

  INSERT INTO public.profiles (
    user_id, full_name, phone, country, referral_code, referred_by, email, username
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'country'), ''),
    v_referral_code,
    v_referred_by,
    COALESCE(NEW.raw_user_meta_data->>'contact_email', NEW.email),
    NULLIF(lower(trim(NEW.raw_user_meta_data->>'username')), '')
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

CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.raw_user_meta_data ? 'contact_email' THEN
    UPDATE public.profiles
    SET email = NEW.raw_user_meta_data->>'contact_email'
    WHERE user_id = NEW.id
      AND email IS DISTINCT FROM NEW.raw_user_meta_data->>'contact_email';
  ELSIF OLD.email IS DISTINCT FROM NEW.email THEN
    UPDATE public.profiles
    SET email = NEW.email
    WHERE user_id = NEW.id
      AND email IS DISTINCT FROM NEW.email;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_email_after_auth_update ON auth.users;
CREATE TRIGGER sync_profile_email_after_auth_update
  AFTER UPDATE OF email, raw_user_meta_data ON auth.users
  FOR EACH ROW
  WHEN (
    OLD.email IS DISTINCT FROM NEW.email
    OR OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data
  )
  EXECUTE FUNCTION public.sync_profile_email();
