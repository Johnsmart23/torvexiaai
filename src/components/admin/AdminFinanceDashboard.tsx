import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Users,
  DollarSign,
  BarChart3,
  Wallet,
} from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const AdminFinanceDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalProfitPaid: 0,
    activeInvestments: 0,
    activeInvestmentValue: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    todayDeposits: 0,
    todayWithdrawals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [profilesRes, txRes, investRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("transactions").select("*"),
      supabase.from("investments").select("*").eq("status", "active"),
    ]);

    const txs = txRes.data || [];
    const completed = txs.filter((t: any) => t.status === "completed");
    const today = new Date().toISOString().slice(0, 10);
    const todayCompleted = completed.filter(
      (t: any) => t.created_at.slice(0, 10) === today
    );
    const investments = investRes.data || [];

    setStats({
      totalUsers: profilesRes.count || 0,
      totalDeposits: completed
        .filter((t: any) => t.transaction_type === "deposit")
        .reduce((s: number, t: any) => s + Number(t.amount), 0),
      totalWithdrawals: completed
        .filter((t: any) => t.transaction_type === "withdrawal")
        .reduce((s: number, t: any) => s + Number(t.amount), 0),
      totalProfitPaid: completed
        .filter((t: any) => t.transaction_type === "profit")
        .reduce((s: number, t: any) => s + Number(t.amount), 0),
      activeInvestments: investments.length,
      activeInvestmentValue: investments.reduce(
        (s: number, i: any) => s + Number(i.amount),
        0
      ),
      pendingDeposits: txs
        .filter((t: any) => t.status === "pending" && t.transaction_type === "deposit")
        .reduce((s: number, t: any) => s + Number(t.amount), 0),
      pendingWithdrawals: txs
        .filter(
          (t: any) =>
            t.status === "pending" && t.transaction_type === "withdrawal"
        )
        .reduce((s: number, t: any) => s + Number(t.amount), 0),
      todayDeposits: todayCompleted
        .filter((t: any) => t.transaction_type === "deposit")
        .reduce((s: number, t: any) => s + Number(t.amount), 0),
      todayWithdrawals: todayCompleted
        .filter((t: any) => t.transaction_type === "withdrawal")
        .reduce((s: number, t: any) => s + Number(t.amount), 0),
    });
    setLoading(false);
  };

  const cards = [
    { label: "Total Users", value: stats.totalUsers.toString(), icon: Users, color: "text-primary" },
    { label: "Total Deposits", value: fmt(stats.totalDeposits), icon: ArrowDownLeft, color: "text-success" },
    { label: "Total Withdrawals", value: fmt(stats.totalWithdrawals), icon: ArrowUpRight, color: "text-destructive" },
    { label: "Profit Paid Out", value: fmt(stats.totalProfitPaid), icon: TrendingUp, color: "text-primary" },
    { label: "Active Investments", value: `${stats.activeInvestments} (${fmt(stats.activeInvestmentValue)})`, icon: BarChart3, color: "text-accent" },
    { label: "Company Balance", value: fmt(stats.totalDeposits - stats.totalWithdrawals - stats.totalProfitPaid), icon: Wallet, color: "text-success" },
    { label: "Pending Deposits", value: fmt(stats.pendingDeposits), icon: Clock, color: "text-warning" },
    { label: "Pending Withdrawals", value: fmt(stats.pendingWithdrawals), icon: Clock, color: "text-warning" },
    { label: "Today's Deposits", value: fmt(stats.todayDeposits), icon: DollarSign, color: "text-success" },
    { label: "Today's Withdrawals", value: fmt(stats.todayWithdrawals), icon: DollarSign, color: "text-destructive" },
  ];

  if (loading) {
    return <p className="text-muted-foreground text-sm py-8 text-center">Loading stats...</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{c.label}</span>
            <c.icon className={`h-5 w-5 ${c.color}`} />
          </div>
          <p className="mt-2 text-xl font-bold text-foreground">{c.value}</p>
        </div>
      ))}
    </div>
  );
};

export default AdminFinanceDashboard;
