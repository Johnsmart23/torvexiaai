
-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can update own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can insert notifications (via functions)
CREATE POLICY "Admins can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow service role / security definer functions to insert
-- We'll use security definer functions for auto-notifications

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to create notification (security definer so triggers can use it)
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text DEFAULT 'info'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (p_user_id, p_title, p_message, p_type);
END;
$$;

-- Trigger: notify on profile changes (suspension, KYC)
CREATE OR REPLACE FUNCTION public.notify_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Suspension changed
  IF OLD.is_suspended IS DISTINCT FROM NEW.is_suspended THEN
    IF NEW.is_suspended THEN
      PERFORM create_notification(NEW.user_id, 'Account Suspended', 'Your account has been suspended. Please contact support for more information.', 'warning');
    ELSE
      PERFORM create_notification(NEW.user_id, 'Account Unsuspended', 'Your account has been reactivated. You can now use all features.', 'success');
    END IF;
  END IF;

  -- KYC status changed
  IF OLD.kyc_status IS DISTINCT FROM NEW.kyc_status THEN
    IF NEW.kyc_status = 'approved' THEN
      PERFORM create_notification(NEW.user_id, 'KYC Approved', 'Your identity verification has been approved. You now have full access.', 'success');
    ELSIF NEW.kyc_status = 'rejected' THEN
      PERFORM create_notification(NEW.user_id, 'KYC Rejected', COALESCE('Your KYC was rejected: ' || NEW.kyc_rejection_reason, 'Your KYC verification was rejected. Please resubmit.'), 'error');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_profile_changes();

-- Trigger: notify on transaction status changes
CREATE OR REPLACE FUNCTION public.notify_transaction_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'completed' THEN
      IF NEW.transaction_type = 'deposit' THEN
        PERFORM create_notification(NEW.user_id, 'Deposit Approved', 'Your deposit of $' || NEW.amount::text || ' has been approved and credited to your wallet.', 'success');
      ELSIF NEW.transaction_type = 'withdrawal' THEN
        PERFORM create_notification(NEW.user_id, 'Withdrawal Approved', 'Your withdrawal of $' || NEW.amount::text || ' has been processed.', 'success');
      ELSIF NEW.transaction_type = 'transfer' THEN
        PERFORM create_notification(NEW.user_id, 'Funds Received', 'You received a transfer of $' || NEW.amount::text || '.', 'success');
      END IF;
    ELSIF NEW.status = 'rejected' THEN
      PERFORM create_notification(NEW.user_id, 'Transaction Rejected', 'Your ' || replace(NEW.transaction_type::text, '_', ' ') || ' of $' || NEW.amount::text || ' was rejected.', 'error');
    END IF;
  END IF;

  -- New transfer inserted as completed
  IF TG_OP = 'INSERT' AND NEW.transaction_type = 'transfer' AND NEW.status = 'completed' THEN
    PERFORM create_notification(NEW.user_id, 'Funds Received', 'You received a transfer of $' || NEW.amount::text || '.', 'success');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_transaction_changes
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_transaction_changes();

-- Trigger: notify on new investment
CREATE OR REPLACE FUNCTION public.notify_investment_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM create_notification(NEW.user_id, 'Investment Started', 'Your investment of $' || NEW.amount::text || ' in ' || NEW.plan_name || ' plan is now active.', 'success');
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed' THEN
    PERFORM create_notification(NEW.user_id, 'Investment Completed', 'Your ' || NEW.plan_name || ' plan investment of $' || NEW.amount::text || ' has completed. Total earned: $' || NEW.total_profit_earned::text, 'success');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_investment_changes
  AFTER INSERT OR UPDATE ON public.investments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_investment_changes();
