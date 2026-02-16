import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

const Register = () => (
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
        <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <Input placeholder="Full name" required />
          <Input type="email" placeholder="Email address" required />
          <Input type="tel" placeholder="Phone number" required />
          <Input type="password" placeholder="Password" required />
          <Input placeholder="Referral code (optional)" />
          <Button className="w-full" type="submit">Create Account</Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  </div>
);

export default Register;
