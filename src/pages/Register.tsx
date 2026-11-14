import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Shield, Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isValidUsername, normalizeUsername } from "@/lib/account-identifiers";
import { toast } from "sonner";

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    country: "",
    password: "",
    referralCode: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidUsername(form.username)) {
      toast.error("Username must be 3–32 characters and use letters, numbers, dots, underscores, or hyphens");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("account-auth", {
        body: {
          action: "signup",
          username: normalizeUsername(form.username),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          full_name: form.fullName.trim(),
          phone: form.phone.trim(),
          country: form.country.trim(),
          referral_code: form.referralCode.trim() || null,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to create account");
      if (data.email_sent === false) {
        toast.error("Your account was created, but the verification email could not be sent. Use the resend button below.");
      }
      setVerificationPending(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("account-auth", {
        body: {
          action: "resend-confirmation",
          username: normalizeUsername(form.username),
          email: form.email.trim().toLowerCase(),
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to resend verification email");
      toast.success("Verification email resent");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to resend verification email");
    } finally {
      setLoading(false);
    }
  };

  if (verificationPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-foreground">TorvexiaAI</span>
            </Link>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 text-center shadow-elevated">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <MailCheck className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Verify Your Email</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a verification link to{" "}
              <span className="font-medium text-foreground">{form.email}</span>.
              We use your username to identify this account, so keep it handy when you sign in.
              Please verify your email before signing in. Check your spam folder if it is not in your inbox.
            </p>
            <Button className="mt-6 w-full" onClick={() => void resendVerificationEmail()} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Resend Verification Email"}
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">
              Already verified?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">TorvexiaAI</span>
          </Link>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-elevated">
          <h1 className="text-xl font-bold text-foreground">Create Account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Start your investment journey</p>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <Input name="fullName" placeholder="Full name" value={form.fullName} onChange={handleChange} required />
            <Input name="username" placeholder="Unique username (used to sign in)" value={form.username} onChange={handleChange} required minLength={3} maxLength={32} pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,31}" autoComplete="username" />
            <Input name="email" type="email" placeholder="Contact email (can be shared across accounts)" value={form.email} onChange={handleChange} required />
            <Input name="phone" type="tel" placeholder="Phone number" value={form.phone} onChange={handleChange} required />
            <Input name="country" placeholder="Country" value={form.country} onChange={handleChange} autoComplete="country-name" required />
            <Input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required minLength={6} />
            <Input name="referralCode" placeholder="Referral code (optional)" value={form.referralCode} onChange={handleChange} />
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "Create Account"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
