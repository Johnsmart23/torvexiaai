import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
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
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            phone: form.phone,
            country: form.country.trim(),
            referral_code: form.referralCode || null,
          },
        },
      });
      if (error) throw error;
      if (!data.session) {
        toast.error("Email confirmation is still enabled in Supabase. Disable it in Auth settings to allow immediate sign-in.");
        return;
      }
      toast.success("Account created successfully");
      navigate("/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

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
            <Input name="email" type="email" placeholder="Email address" value={form.email} onChange={handleChange} required />
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
