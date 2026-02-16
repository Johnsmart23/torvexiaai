import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

const Login = () => (
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
        <h1 className="text-xl font-bold text-foreground">Sign In</h1>
        <p className="mt-1 text-sm text-muted-foreground">Access your investment dashboard</p>
        <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <Input type="email" placeholder="Email address" required />
          <Input type="password" placeholder="Password" required />
          <Button className="w-full" type="submit">Sign In</Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">Register</Link>
        </p>
      </div>
    </div>
  </div>
);

export default Login;
