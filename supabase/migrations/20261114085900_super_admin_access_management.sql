CREATE TABLE IF NOT EXISTS public.super_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.super_admins FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  v_match_count INTEGER;
  v_user_id UUID;
BEGIN
  SELECT count(*), (array_agg(p.user_id))[1]
  INTO v_match_count, v_user_id
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE lower(btrim(p.full_name)) = lower('Odenigbo John Nkemakonam');

  IF v_match_count <> 1 THEN
    RAISE EXCEPTION
      'Expected exactly one registered account named Odenigbo John Nkemakonam; found %. Create or correct that user profile before applying this migration.',
      v_match_count;
  END IF;

  INSERT INTO public.super_admins (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.profiles
  SET is_admin = true
  WHERE user_id = v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.super_admins
    WHERE user_id = p_user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
  OR (
    _role = 'admin'::public.app_role
    AND public.is_super_admin(_user_id)
  )
$$;

UPDATE public.profiles p
SET is_admin = (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p.user_id AND ur.role = 'admin'
  )
  OR EXISTS (
    SELECT 1 FROM public.super_admins sa
    WHERE sa.user_id = p.user_id
  )
);

CREATE OR REPLACE FUNCTION public.prevent_non_super_admin_role_flag_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin
     AND auth.uid() IS NOT NULL
     AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Super-admin access required to change admin status';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_non_super_admin_role_flag_changes ON public.profiles;
CREATE TRIGGER prevent_non_super_admin_role_flag_changes
  BEFORE UPDATE OF is_admin ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_non_super_admin_role_flag_changes();

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Super admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.set_user_admin_role(
  p_user_id UUID,
  p_make_admin BOOLEAN
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin(auth.uid()) THEN
    RETURN json_build_object('success', false, 'error', 'Super-admin access required');
  END IF;

  IF p_user_id IS NULL OR p_make_admin IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'A user and admin action are required');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'User account not found');
  END IF;

  IF NOT p_make_admin AND public.is_super_admin(p_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'The super-admin role cannot be removed here');
  END IF;

  IF p_make_admin THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (p_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM public.user_roles
    WHERE user_id = p_user_id AND role = 'admin';
  END IF;

  UPDATE public.profiles
  SET is_admin = p_make_admin
  WHERE user_id = p_user_id;

  RETURN json_build_object('success', true, 'is_admin', p_make_admin);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_roster()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  is_super_admin BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Super-admin access required';
  END IF;

  RETURN QUERY
  SELECT u.id, u.email::TEXT, p.full_name, (sa.user_id IS NOT NULL), u.created_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  LEFT JOIN public.user_roles ur ON ur.user_id = u.id AND ur.role = 'admin'
  LEFT JOIN public.super_admins sa ON sa.user_id = u.id
  WHERE ur.user_id IS NOT NULL OR sa.user_id IS NOT NULL
  ORDER BY (sa.user_id IS NOT NULL) DESC, u.created_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_user_emails()
RETURNS TABLE (user_id UUID, email TEXT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT u.id, u.email::TEXT
  FROM auth.users u
  JOIN public.profiles p ON p.user_id = u.id;
END;
$$;

REVOKE ALL ON FUNCTION public.is_super_admin(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO authenticated;
REVOKE ALL ON FUNCTION public.set_user_admin_role(UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_user_admin_role(UUID, BOOLEAN) TO authenticated;
REVOKE ALL ON FUNCTION public.get_admin_roster() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_roster() TO authenticated;
REVOKE ALL ON FUNCTION public.get_admin_user_emails() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_user_emails() TO authenticated;
