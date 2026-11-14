import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAccountAuthEmail, isValidUsername, normalizeUsername } from "@/lib/account-identifiers";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [resetUsername, setResetUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotMode, setForgotMode] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const loginId = identifier.trim();
      const loginEmail = loginId.includes("@")
        ? loginId.toLowerCase()
        : isValidUsername(loginId)
          ? getAccountAuthEmail(loginId)
          : null;
      if (!loginEmail) {
        toast.error("Enter your username or email address");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
      if (error) throw error;
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (resetUsername.trim()) {
        if (!isValidUsername(resetUsername)) {
          toast.error("Enter a valid username");
          return;
        }
        const { data, error } = await supabase.functions.invoke("account-auth", {
          body: {
            action: "reset-password",
            username: normalizeUsername(resetUsername),
            email: email.trim().toLowerCase(),
          },
        });
        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || "Failed to send reset link");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
      }
      toast.success("Password reset link sent! Check your email.");
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset link");
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
          <h1 className="text-xl font-bold text-foreground">
            {forgotMode ? "Reset Password" : "Sign In"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {forgotMode ? "Enter your email to receive a reset link" : "Access your investment dashboard"}
          </p>

          {forgotMode ? (
            <form className="mt-6 space-y-4" onSubmit={handleForgotPassword}>
              <Input type="email" placeholder="Account email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input type="text" placeholder="Username (required for shared email accounts)" value={resetUsername} onChange={(e) => setResetUsername(e.target.value)} autoComplete="username" />
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : "Send Reset Link"}
              </Button>
              <button type="button" onClick={() => setForgotMode(false)} className="w-full text-sm text-primary hover:underline">
                Back to Sign In
              </button>
            </form>
          ) : (
            <>
              <form className="mt-6 space-y-4" onSubmit={handleLogin}>
                <Input type="text" placeholder="Username or email address" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" required />
                <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <Button className="w-full" type="submit" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : "Sign In"}
                </Button>
              </form>
              <button type="button" onClick={() => setForgotMode(true)} className="mt-3 w-full text-sm text-primary hover:underline">
                Forgot password?
              </button>
            </>
          )}

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
