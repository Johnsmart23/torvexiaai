import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
  History,
  UserCheck,
} from "lucide-react";

const wallets = [
  { label: "Deposit Wallet", amount: "$5,000.00", usdt: "≈ 5,000 USDT", icon: Wallet, color: "text-primary" },
  { label: "Active Investments", amount: "$12,500.00", usdt: "≈ 12,500 USDT", icon: BarChart3, color: "text-accent" },
  { label: "Profit Wallet", amount: "$1,875.00", usdt: "≈ 1,875 USDT", icon: TrendingUp, color: "text-success" },
  { label: "Referral Earnings", amount: "$350.00", usdt: "≈ 350 USDT", icon: Users, color: "text-warning" },
];

const investments = [
  { plan: "Gold", amount: "$5,000", daily: "$200.00", progress: 60, daysLeft: 12 },
  { plan: "Silver", amount: "$4,500", daily: "$112.50", progress: 40, daysLeft: 18 },
  { plan: "Bronze", amount: "$3,000", daily: "$30.00", progress: 80, daysLeft: 6 },
];

const transactions = [
  { type: "Deposit", amount: "+$5,000.00", date: "Feb 14, 2026", status: "Completed", icon: ArrowDownLeft },
  { type: "Profit", amount: "+$200.00", date: "Feb 15, 2026", status: "Credited", icon: TrendingUp },
  { type: "Referral", amount: "+$50.00", date: "Feb 15, 2026", status: "Credited", icon: Users },
  { type: "Withdrawal", amount: "-$1,000.00", date: "Feb 13, 2026", status: "Pending", icon: ArrowUpRight },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/5 p-3">
          <UserCheck className="h-5 w-5 text-warning shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">KYC Verification Pending</p>
            <p className="text-xs text-muted-foreground">Complete verification to enable withdrawals.</p>
          </div>
          <Button size="sm" variant="outline">Verify Now</Button>
        </div>

        {/* Wallet cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {wallets.map((w) => (
            <div key={w.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{w.label}</span>
                <w.icon className={`h-5 w-5 ${w.color}`} />
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">{w.amount}</p>
              <p className="text-xs text-muted-foreground">{w.usdt}</p>
            </div>
          ))}
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
              {tab === "overview" ? "Active Investments" : "Transaction History"}
            </button>
          ))}
        </div>

        {activeTab === "overview" ? (
          <div className="mt-6 space-y-4">
            {investments.map((inv) => (
              <div key={inv.plan} className="rounded-xl border border-border bg-card p-5 shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{inv.plan} Plan</h3>
                    <p className="text-sm text-muted-foreground">Invested: {inv.amount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-success">+{inv.daily}/day</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {inv.daysLeft} days left
                    </p>
                  </div>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-secondary">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${inv.progress}%` }}
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline">Reinvest Profit</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {transactions.map((tx, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-card">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  tx.type === "Withdrawal" ? "bg-destructive/10" : "bg-success/10"
                }`}>
                  <tx.icon className={`h-4 w-4 ${
                    tx.type === "Withdrawal" ? "text-destructive" : "text-success"
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{tx.type}</p>
                  <p className="text-xs text-muted-foreground">{tx.date}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${
                    tx.amount.startsWith("+") ? "text-success" : "text-destructive"
                  }`}>{tx.amount}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                    {tx.status === "Pending" ? <Clock className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                    {tx.status}
                  </p>
                </div>
              </div>
            ))}
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
