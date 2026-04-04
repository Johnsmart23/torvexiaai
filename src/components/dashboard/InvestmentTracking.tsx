import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Wallet,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import ProfitGrowthChart from "./ProfitGrowthChart";

interface Investment {
  id: string;
  plan_name: string;
  amount: number;
  daily_rate: number;
  duration_days: number;
  days_completed: number;
  total_profit_earned: number;
  started_at: string;
  ends_at: string;
  status: string;
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

      {/* Investment Cards */}
      {investments.map((inv) => {
        const daysLeft = Math.max(0, inv.duration_days - inv.days_completed);
        const progress = Math.round((inv.days_completed / inv.duration_days) * 100);
        const dailyProfit = (Number(inv.amount) * Number(inv.daily_rate)) / 100;
        const totalExpected = dailyProfit * inv.duration_days;
        const isExpanded = expandedId === inv.id;
        const maturityDate = new Date(inv.ends_at);
        const startDate = new Date(inv.started_at);

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

              {/* Progress */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Day {inv.days_completed} of {inv.duration_days}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
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
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Days Left</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {daysLeft} days
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Maturity Date</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {maturityDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>

              {/* Profit Growth Bar */}
              <div className="mt-4 rounded-lg bg-muted/30 p-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Profit Growth</span>
                  <span className="font-medium text-foreground">
                    {fmt(Number(inv.total_profit_earned))} / {fmt(totalExpected)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary">
                  <div
                    className="h-2 rounded-full bg-success transition-all"
                    style={{ width: `${Math.min(100, (Number(inv.total_profit_earned) / totalExpected) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Expand Toggle */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : inv.id)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 border-t border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
            >
              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {isExpanded ? "Hide" : "View"} Interest Schedule
            </button>

            {/* Interest Schedule (collapsible) */}
            {isExpanded && (
              <div className="border-t border-border p-5 bg-muted/10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Day 1 – Day {inv.duration_days}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expected: <span className="text-success font-semibold">{fmt(totalExpected)}</span>
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-72 overflow-y-auto pr-1">
                  {Array.from({ length: inv.duration_days }, (_, i) => {
                    const dayDate = new Date(startDate);
                    dayDate.setDate(startDate.getDate() + i);
                    const isPaid = i < inv.days_completed;
                    const isToday = i === inv.days_completed && dayDate.toDateString() === new Date().toDateString();
                    const dateStr = dayDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs border transition-colors ${
                          isPaid
                            ? "bg-success/10 border-success/30"
                            : isToday
                            ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                            : "bg-muted/30 border-border"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className={`font-medium ${isPaid ? "text-success" : isToday ? "text-primary" : "text-muted-foreground"}`}>
                            Day {i + 1}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{dateStr}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {isPaid && <CheckCircle className="h-3 w-3 text-success" />}
                          {isToday && <Clock className="h-3 w-3 text-primary" />}
                          <span className={`font-semibold ${isPaid ? "text-success" : isToday ? "text-primary" : "text-muted-foreground/60"}`}>
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
