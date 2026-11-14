import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import type { InvestmentPlan } from "@/hooks/use-investment-plans";

interface PlanCardProps {
  plan: InvestmentPlan;
  highlighted?: boolean;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(amount);

const PlanCard = ({ plan, highlighted }: PlanCardProps) => {
  const features = [
    `Minimum deposit ${formatCurrency(plan.min_deposit)}`,
    ...(plan.max_deposit === null ? [] : [`Maximum deposit ${formatCurrency(plan.max_deposit)}`]),
    "Daily profit accrual",
    "Ongoing profit with no fixed end date",
    ...(plan.referral_bonus > 0 ? [`${plan.referral_bonus}% referral bonus`] : []),
  ];

  return (
  <motion.div
    whileHover={{ y: -8, transition: { duration: 0.25 } }}
    className={`relative rounded-xl border p-6 transition-shadow duration-200 ${
      highlighted
        ? "border-accent bg-card shadow-elevated scale-[1.02]"
        : "border-border bg-card shadow-card hover:shadow-elevated"
    }`}
  >
    {highlighted && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-accent-foreground">
        Most Popular
      </div>
    )}
    <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
    <div className="mt-3 flex items-baseline gap-1">
      <span className="text-4xl font-bold text-primary">{plan.daily_rate}%</span>
      <span className="text-sm text-muted-foreground">/ day</span>
    </div>
    <p className="mt-1 text-sm text-muted-foreground">
      {plan.is_active ? "Ongoing · No fixed end date" : "Currently unavailable"}
    </p>
    <ul className="mt-5 space-y-2">
      {features.map((f) => (
        <li key={f} className="flex items-center gap-2 text-sm text-foreground">
          <Check className="h-4 w-4 text-success" />
          {f}
        </li>
      ))}
    </ul>
    <Button
      variant={highlighted ? "hero" : "default"}
      className="mt-6 w-full"
      disabled
    >
      Invest
    </Button>
  </motion.div>
  );
};

export default PlanCard;
