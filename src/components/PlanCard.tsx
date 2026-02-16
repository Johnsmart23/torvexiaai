import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

interface PlanCardProps {
  name: string;
  dailyProfit: string;
  duration: string;
  capitalReturn: string;
  features: string[];
  highlighted?: boolean;
}

const PlanCard = ({ name, dailyProfit, duration, capitalReturn, features, highlighted }: PlanCardProps) => (
  <div
    className={`relative rounded-xl border p-6 transition-all duration-200 ${
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
    <h3 className="text-lg font-bold text-foreground">{name}</h3>
    <div className="mt-3 flex items-baseline gap-1">
      <span className="text-4xl font-bold text-primary">{dailyProfit}</span>
      <span className="text-sm text-muted-foreground">/ day</span>
    </div>
    <p className="mt-1 text-sm text-muted-foreground">{duration} · Capital returned {capitalReturn}</p>
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
      asChild
    >
      <Link to="/register">Start Investing</Link>
    </Button>
  </div>
);

export default PlanCard;
