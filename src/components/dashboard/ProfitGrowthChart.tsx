import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";

interface Investment {
  id: string;
  plan_name: string;
  amount: number;
  daily_rate: number;
  days_completed: number;
  total_profit_earned: number;
}

interface ProfitGrowthChartProps {
  investments: Investment[];
  fmt: (n: number) => string;
}

const ProfitGrowthChart = ({ investments, fmt }: ProfitGrowthChartProps) => {
  const chartData = useMemo(() => {
    if (!investments.length) return [];

    const maxDays = Math.min(30, Math.max(...investments.map((inv) => inv.days_completed)));
    const startingProfit = investments.reduce((total, inv) => {
      const dailyProfit = (Number(inv.amount) * Number(inv.daily_rate)) / 100;
      return total + Math.max(0, Number(inv.total_profit_earned) - dailyProfit * Math.min(inv.days_completed, maxDays));
    }, 0);

    const data = [];
    for (let day = 0; day <= maxDays; day++) {
      let cumulativeProfit = startingProfit;
      let dailyProfit = 0;

      investments.forEach((inv) => {
        const invDailyProfit = (Number(inv.amount) * Number(inv.daily_rate)) / 100;
        const visibleDays = Math.min(inv.days_completed, maxDays);
        const firstVisibleDay = maxDays - visibleDays;
        const visibleProfitDays = Math.max(0, Math.min(day - firstVisibleDay, visibleDays));
        if (day > firstVisibleDay) {
          cumulativeProfit += invDailyProfit * visibleProfitDays;
          dailyProfit += invDailyProfit;
        }
      });

      data.push({
        day: day === 0 ? "Earlier" : `Credit ${day}`,
        profit: Math.round(cumulativeProfit * 100) / 100,
        daily: Math.round(dailyProfit * 100) / 100,
      });
    }

    return data;
  }, [investments]);

  if (!chartData.length) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
          <TrendingUp className="h-4 w-4 text-success" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-sm">Profit Growth</h3>
          <p className="text-xs text-muted-foreground">Latest 30 credited interest days</p>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${v}`}
              width={55}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-xs">
                    <p className="font-medium text-foreground mb-1">{label}</p>
                    <p className="text-success">
                      Total Profit: <span className="font-semibold">{fmt(payload[0].value as number)}</span>
                    </p>
                    {payload[1] && (
                      <p className="text-muted-foreground">
                        Daily: <span className="font-medium">{fmt(payload[1].value as number)}</span>
                      </p>
                    )}
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="profit"
              stroke="hsl(var(--success))"
              strokeWidth={2}
              fill="url(#profitGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "hsl(var(--success))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="daily"
              stroke="hsl(var(--primary))"
              strokeWidth={1.5}
              fill="none"
              dot={false}
              strokeDasharray="4 4"
              activeDot={{ r: 3, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-4 rounded-full bg-success" />
          <span>Cumulative Profit</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-0.5 w-4 border-t-2 border-dashed border-primary" />
          <span>Daily Earnings</span>
        </div>
      </div>
    </div>
  );
};

export default ProfitGrowthChart;
