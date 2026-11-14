import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import InvestmentTracking from "@/components/dashboard/InvestmentTracking";
import TradingViewChart from "@/components/dashboard/TradingViewChart";
import DepositDialog from "@/components/DepositDialog";
import WithdrawDialog from "@/components/WithdrawDialog";
import NotificationBell from "@/components/NotificationBell";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAdmin } from "@/hooks/use-admin";
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
  Menu,
  BarChart3,
  UserRound,
  ShieldCheck,
  UserCheck,
  Loader2,
  XCircle,
} from "lucide-react";

const walletMeta: Record<string, { label: string; icon: any; color: string }> = {
  deposit: { label: "Deposit Wallet", icon: Wallet, color: "text-primary" },
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
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [profitsPaused, setProfitsPaused] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState("pending");
  const [referralCode, setReferralCode] = useState("");
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [walletsRes, txRes, profileRes, investRes, settingsRes] = await Promise.all([
        supabase.from("wallets").select("*").eq("user_id", user.id),
        supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase.from("profiles").select("kyc_status, referral_code").eq("user_id", user.id).single(),
        supabase
          .from("investments")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false }),
        supabase.from("investment_settings").select("profits_paused").eq("id", 1).single(),
      ]);
      setWallets(walletsRes.data || []);
      setTransactions(txRes.data || []);
      setInvestments(investRes.data || []);
      setKycStatus(profileRes.data?.kyc_status || "pending");
      setReferralCode(profileRes.data?.referral_code || "");
      if (settingsRes.error) {
        toast.error("Unable to load current profit status");
      } else {
        setProfitsPaused(settingsRes.data.profits_paused);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const reload = () => {
    if (!user) return;
    setLoading(true);
    const load = async () => {
      const [walletsRes, txRes, investRes, settingsRes] = await Promise.all([
        supabase.from("wallets").select("*").eq("user_id", user.id),
        supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
        supabase.from("investments").select("*").eq("user_id", user.id).eq("status", "active").order("created_at", { ascending: false }),
        supabase.from("investment_settings").select("profits_paused").eq("id", 1).single(),
      ]);
      setWallets(walletsRes.data || []);
      setTransactions(txRes.data || []);
      setInvestments(investRes.data || []);
      if (settingsRes.error) {
        toast.error("Unable to load current profit status");
      } else {
        setProfitsPaused(settingsRes.data.profits_paused);
      }
      setLoading(false);
    };
    load();
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  const copyReferralLink = async () => {
    if (!referralCode) {
      toast.error("Your referral code is not available yet");
      return;
    }

    try {
      await navigator.clipboard.writeText(`${window.location.origin}/register?ref=${referralCode}`);
      toast.success("Referral link copied");
    } catch {
      toast.error("Could not copy referral link");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Order wallets consistently
  const walletOrder = ["deposit", "profit", "referral", "withdrawable"];
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
            <span className="font-bold text-foreground">TorvexiaAI</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden md:inline">{user?.email}</span>
            <NotificationBell />
            <Button className="hidden md:inline-flex" variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>
              <LogOut className="h-4 w-4" />
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open dashboard menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] md:hidden">
                <SheetHeader>
                  <SheetTitle>Dashboard Menu</SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col gap-2">
                  <SheetClose asChild>
                    <Button variant="ghost" className="justify-start px-3" onClick={() => setDepositOpen(true)}>
                      <ArrowDownLeft className="h-4 w-4" /> Deposit
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button variant="ghost" className="justify-start px-3" onClick={() => setWithdrawOpen(true)}>
                      <ArrowUpRight className="h-4 w-4" /> Withdraw
                    </Button>
                  </SheetClose>
                  <Button variant="ghost" className="justify-start px-3" onClick={() => void copyReferralLink()}>
                    <Users className="h-4 w-4" /> Referral Link
                  </Button>
                  <SheetClose asChild>
                    <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary">
                      <Shield className="h-4 w-4" /> Home
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link to="/profile" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary">
                      <UserRound className="h-4 w-4" /> Profile
                    </Link>
                  </SheetClose>
                  {isAdmin && (
                    <SheetClose asChild>
                      <Link to="/admin" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary">
                        <ShieldCheck className="h-4 w-4" /> Admin
                      </Link>
                    </SheetClose>
                  )}
                  <Button
                    variant="ghost"
                    className="justify-start px-3"
                    onClick={async () => { await signOut(); navigate("/"); }}
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {profitsPaused && (
          <div className="mb-6 rounded-lg border border-warning/30 bg-warning/5 p-4 text-sm text-foreground">
            Daily profit accrual is paused. Missed days will not be credited; existing investments continue on the next scheduled run after profits resume.
          </div>
        )}

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

        {/* Daily Interest Summary */}
        {investments.length > 0 && (() => {
          const totalDailyProfit = investments.reduce((sum: number, inv: any) => sum + (Number(inv.amount) * Number(inv.daily_rate) / 100), 0);
          const totalInvested = investments.reduce((sum: number, inv: any) => sum + Number(inv.amount), 0);
          const totalEarned = investments.reduce((sum: number, inv: any) => sum + Number(inv.total_profit_earned), 0);
          return (
            <div className="mb-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-success/30 bg-success/5 p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Daily Interest</span>
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <p className="mt-2 text-2xl font-bold text-success">{fmt(totalDailyProfit)}</p>
                <p className="text-xs text-muted-foreground">
                  {profitsPaused ? "Accrual paused by admin" : "Expected at current rate"}
                </p>
              </div>
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Invested</span>
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-2 text-2xl font-bold text-foreground">{fmt(totalInvested)}</p>
                <p className="text-xs text-muted-foreground">{investments.length} active plan{investments.length > 1 ? "s" : ""}</p>
              </div>
              <div className="rounded-xl border border-accent/30 bg-accent/5 p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Earned</span>
                  <Wallet className="h-5 w-5 text-accent" />
                </div>
                <p className="mt-2 text-2xl font-bold text-foreground">{fmt(totalEarned)}</p>
                <p className="text-xs text-muted-foreground">Accumulated profit</p>
              </div>
            </div>
          );
        })()}

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

        <div className="mt-8">
          <TradingViewChart />
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
          <div className="mt-6">
            <InvestmentTracking investments={investments} fmt={fmt} />
            {investments.length === 0 && (
              <div className="mt-4 text-center">
                <Button variant="outline" onClick={() => setDepositOpen(true)}>Deposit Funds</Button>
              </div>
            )}
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
          <Button variant="outline" size="lg" onClick={() => setDepositOpen(true)}>Deposit Funds</Button>
          <Button variant="outline" size="lg" onClick={() => setWithdrawOpen(true)}>Withdraw</Button>
          <Button variant="secondary" size="lg">
            <Users className="h-4 w-4" /> Referral Link
          </Button>
        </div>
      </div>

      <DepositDialog
        open={depositOpen}
        onOpenChange={setDepositOpen}
        onSuccess={reload}
      />
      <WithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        withdrawableBalance={Number(wallets.find((w: any) => w.wallet_type === "withdrawable")?.balance || 0)}
        onSuccess={reload}
      />
    </div>
  );
};

export default Dashboard;
