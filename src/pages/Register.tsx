import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const getEmailProviderUrl = (email: string) => {
  const domain = email.split("@")[1]?.toLowerCase();
  const providers: Record<string, string> = {
    "gmail.com": "https://mail.google.com",
    "yahoo.com": "https://mail.yahoo.com",
    "outlook.com": "https://outlook.live.com",
    "hotmail.com": "https://outlook.live.com",
    "icloud.com": "https://www.icloud.com/mail",
  };
  return providers[domain] || `https://mail.google.com`;
};

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    referralCode: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            phone: form.phone,
            referral_code: form.referralCode || null,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
      setEmailSent(true);
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-foreground">VaultEdge</span>
            </Link>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-elevated text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <MailCheck className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Verify Your Email</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We've sent a verification link to <span className="font-medium text-foreground">{form.email}</span>. Please check your inbox and click the link to activate your account.
            </p>
            <Button
              className="mt-6 w-full"
              onClick={() => window.open(getEmailProviderUrl(form.email), "_blank")}
            >
              Open Email
            </Button>
            <Button
              variant="outline"
              className="mt-2 w-full"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  const { error } = await supabase.auth.resend({
                    type: "signup",
                    email: form.email,
                  });
                  if (error) throw error;
                  toast.success("Verification email resent!");
                } catch (err: any) {
                  toast.error(err.message || "Failed to resend email");
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Resend Verification Email"}
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">
              Already verified?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">Sign In</Link>
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
            <span className="text-2xl font-bold text-foreground">VaultEdge</span>
          </Link>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-elevated">
          <h1 className="text-xl font-bold text-foreground">Create Account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Start your investment journey</p>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <Input name="fullName" placeholder="Full name" value={form.fullName} onChange={handleChange} required />
            <Input name="email" type="email" placeholder="Email address" value={form.email} onChange={handleChange} required />
            <Input name="phone" type="tel" placeholder="Phone number" value={form.phone} onChange={handleChange} required />
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
