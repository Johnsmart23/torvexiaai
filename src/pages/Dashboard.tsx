import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Wallet,
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  LogOut,
  BarChart3,
  UserCheck,
  Loader2,
  XCircle,
} from "lucide-react";

const walletMeta: Record<string, { label: string; icon: any; color: string }> = {
  deposit: { label: "Deposit Wallet", icon: Wallet, color: "text-primary" },
  active_investment: { label: "Active Investments", icon: BarChart3, color: "text-accent" },
  profit: { label: "Profit Wallet", icon: TrendingUp, color: "text-success" },
  referral: { label: "Referral Earnings", icon: Users, color: "text-warning" },
  withdrawable: { label: "Withdrawable", icon: ArrowUpRight, color: "text-primary" },
};

const txIcon: Record<string, any> = {
  deposit: ArrowDownLeft,
  withdrawal: ArrowUpRight,
  profit: TrendingUp,
  referral_bonus: Users,
  investment: BarChart3,
  capital_return: Wallet,
  transfer: ArrowUpRight,
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState("pending");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [walletsRes, txRes, profileRes] = await Promise.all([
        supabase.from("wallets").select("*").eq("user_id", user.id),
        supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase.from("profiles").select("kyc_status").eq("user_id", user.id).single(),
      ]);
      setWallets(walletsRes.data || []);
      setTransactions(txRes.data || []);
      setKycStatus(profileRes.data?.kyc_status || "pending");
      setLoading(false);
    };
    load();
  }, [user]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Order wallets consistently
  const walletOrder = ["deposit", "active_investment", "profit", "referral", "withdrawable"];
  const sortedWallets = walletOrder
    .map((wt) => wallets.find((w) => w.wallet_type === wt))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">VaultEdge</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* KYC Banner */}
        {kycStatus !== "approved" && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/5 p-3">
            <UserCheck className="h-5 w-5 text-warning shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                KYC Verification {kycStatus === "rejected" ? "Rejected" : "Pending"}
              </p>
              <p className="text-xs text-muted-foreground">
                {kycStatus === "rejected"
                  ? "Your verification was rejected. Please contact support."
                  : "Complete verification to enable withdrawals."}
              </p>
            </div>
            {kycStatus === "pending" && (
              <Button size="sm" variant="outline">Verify Now</Button>
            )}
          </div>
        )}

        {/* Wallet cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {sortedWallets.map((w: any) => {
            const meta = walletMeta[w.wallet_type] || { label: w.wallet_type, icon: Wallet, color: "text-primary" };
            const Icon = meta.icon;
            const bal = Number(w.balance);
            return (
              <div key={w.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{meta.label}</span>
                  <Icon className={`h-5 w-5 ${meta.color}`} />
                </div>
                <p className="mt-2 text-2xl font-bold text-foreground">{fmt(bal)}</p>
                <p className="text-xs text-muted-foreground">≈ {bal.toLocaleString()} USDT</p>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="mt-8 flex gap-1 border-b border-border">
          {(["overview", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "overview" ? "Overview" : "Transaction History"}
            </button>
          ))}
        </div>

        {activeTab === "overview" ? (
          <div className="mt-6 rounded-xl border border-border bg-card p-8 shadow-card text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold text-foreground">No Active Investments</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Deposit funds and invest in a plan to start earning daily profits.
            </p>
            <Button className="mt-4" onClick={() => navigate("/plans")}>
              View Plans
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {transactions.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 shadow-card text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-lg font-semibold text-foreground">No Transactions Yet</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Your transaction history will appear here.
                </p>
              </div>
            ) : (
              transactions.map((tx: any) => {
                const Icon = txIcon[tx.transaction_type] || ArrowUpRight;
                const isDebit = ["withdrawal", "investment"].includes(tx.transaction_type);
                return (
                  <div key={tx.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-card">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isDebit ? "bg-destructive/10" : "bg-success/10"}`}>
                      <Icon className={`h-4 w-4 ${isDebit ? "text-destructive" : "text-success"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground capitalize">
                        {tx.transaction_type.replace("_", " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${isDebit ? "text-destructive" : "text-success"}`}>
                        {isDebit ? "-" : "+"}{fmt(Math.abs(Number(tx.amount)))}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        {tx.status === "pending" ? <Clock className="h-3 w-3" /> : 
                         tx.status === "rejected" ? <XCircle className="h-3 w-3" /> : 
                         <CheckCircle className="h-3 w-3" />}
                        <span className="capitalize">{tx.status}</span>
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Quick actions */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="hero" size="lg">Deposit Funds</Button>
          <Button variant="outline" size="lg">Withdraw</Button>
          <Button variant="secondary" size="lg">
            <Users className="h-4 w-4" /> Referral Link
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
