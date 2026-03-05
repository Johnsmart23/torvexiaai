
-- Create KYC documents storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false);

-- RLS for kyc-documents bucket: users can upload their own docs
CREATE POLICY "Users can upload own KYC docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can view their own KYC docs
CREATE POLICY "Users can view own KYC docs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Admins can view all KYC docs
CREATE POLICY "Admins can view all KYC docs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'kyc-documents' AND public.has_role(auth.uid(), 'admin'));

-- Users can update/replace their own docs
CREATE POLICY "Users can update own KYC docs"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add kyc_document_url and kyc_rejection_reason to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_document_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_rejection_reason text;

-- Create admin delete user function
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_admin_id uuid, p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(p_admin_id, 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Delete user wallets
  DELETE FROM public.wallets WHERE user_id = p_user_id;
  -- Delete user transactions
  DELETE FROM public.transactions WHERE user_id = p_user_id;
  -- Delete user investments
  DELETE FROM public.investments WHERE user_id = p_user_id;
  -- Delete user roles
  DELETE FROM public.user_roles WHERE user_id = p_user_id;
  -- Delete user profile
  DELETE FROM public.profiles WHERE user_id = p_user_id;
  -- Delete the auth user
  DELETE FROM auth.users WHERE id = p_user_id;

  RETURN json_build_object('success', true);
END;
$$;
