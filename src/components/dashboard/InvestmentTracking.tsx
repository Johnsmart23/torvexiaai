import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ProfitGrowthChart from "./ProfitGrowthChart";

interface Investment {
  id: string;
  plan_name: string;
  amount: number;
  daily_rate: number;
  days_completed: number;
  total_profit_earned: number;
  started_at: string;
}

interface InvestmentTrackingProps {
  investments: Investment[];
  fmt: (n: number) => string;
}

const InvestmentTracking = ({ investments, fmt }: InvestmentTrackingProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (investments.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 shadow-card text-center">
        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold text-foreground">No Active Investments</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Deposit funds and invest in a plan to start earning daily profits.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs text-muted-foreground">Total Invested</p>
          <p className="text-xl font-bold text-foreground mt-1">
            {fmt(investments.reduce((s, i) => s + Number(i.amount), 0))}
          </p>
        </div>
        <div className="rounded-xl border border-success/20 bg-success/5 p-4">
          <p className="text-xs text-muted-foreground">Total Profit Earned</p>
          <p className="text-xl font-bold text-success mt-1">
            {fmt(investments.reduce((s, i) => s + Number(i.total_profit_earned), 0))}
          </p>
        </div>
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
          <p className="text-xs text-muted-foreground">Daily Income</p>
          <p className="text-xl font-bold text-foreground mt-1">
            {fmt(investments.reduce((s, i) => s + (Number(i.amount) * Number(i.daily_rate)) / 100, 0))}
          </p>
        </div>
      </div>

      {/* Profit Growth Chart */}
      <ProfitGrowthChart investments={investments} fmt={fmt} />

      {/* Investment Cards */}
      {investments.map((inv) => {
        const dailyProfit = (Number(inv.amount) * Number(inv.daily_rate)) / 100;
        const isExpanded = expandedId === inv.id;
        const startDate = new Date(inv.started_at);
        const firstVisibleDay = Math.max(0, inv.days_completed - 30);
        const visibleDays = Math.min(inv.days_completed, 30);

        return (
          <div key={inv.id} className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
            {/* Card Header */}
            <div className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{inv.plan_name} Plan</h3>
                    <p className="text-sm text-muted-foreground">
                      {fmt(Number(inv.amount))} · {inv.daily_rate}% daily
                    </p>
                  </div>
                </div>
                <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/10">
                  Active
                </Badge>
              </div>

              {/* Key Metrics */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Daily Profit</p>
                  <p className="text-sm font-semibold text-success mt-0.5">+{fmt(dailyProfit)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Total Earned</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{fmt(Number(inv.total_profit_earned))}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Interest Days Credited</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5 flex items-center gap-1">
                    {inv.days_completed}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Started</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5 flex items-center gap-1">
                    {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>

            </div>

            {/* Expand Toggle */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : inv.id)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 border-t border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
            >
              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {isExpanded ? "Hide" : "View"} Recent Interest Activity
            </button>

            {/* Interest Schedule (collapsible) */}
            {isExpanded && (
              <div className="border-t border-border p-5 bg-muted/10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Recent credited days
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {inv.days_completed} total days credited
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-72 overflow-y-auto pr-1">
                  {Array.from({ length: visibleDays }, (_, index) => {
                    const i = firstVisibleDay + index;
                    const isPaid = i < inv.days_completed;

                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs border transition-colors ${
                          isPaid
                            ? "bg-success/10 border-success/30"
                            : "bg-muted/30 border-border"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className={`font-medium ${isPaid ? "text-success" : "text-muted-foreground"}`}>
                            Interest day {i + 1}
                          </span>
                          <span className="text-[10px] text-muted-foreground">10% of principal</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {isPaid && <CheckCircle className="h-3 w-3 text-success" />}
                          <span className={`font-semibold ${isPaid ? "text-success" : "text-muted-foreground/60"}`}>
                            {isPaid ? "+" : ""}{fmt(dailyProfit)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default InvestmentTracking;
