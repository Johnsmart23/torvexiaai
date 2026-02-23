import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const plans = [
  { name: "Bronze", minDeposit: 10, dailyRate: 1, duration: 30 },
  { name: "Silver", minDeposit: 50, dailyRate: 2.5, duration: 30 },
  { name: "Gold", minDeposit: 100, dailyRate: 4, duration: 30 },
];

interface InvestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  depositBalance: number;
  onSuccess: () => void;
}

const InvestDialog = ({ open, onOpenChange, depositBalance, onSuccess }: InvestDialogProps) => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInvest = async () => {
    if (!user || !selectedPlan) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (numAmount < selectedPlan.minDeposit) {
      toast.error(`Minimum investment for ${selectedPlan.name} is $${selectedPlan.minDeposit}`);
      return;
    }
    if (numAmount > depositBalance) {
      toast.error(`Insufficient balance. You have $${depositBalance.toFixed(2)}`);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("process_investment", {
        p_user_id: user.id,
        p_plan_name: selectedPlan.name,
        p_amount: numAmount,
        p_daily_rate: selectedPlan.dailyRate,
        p_duration_days: selectedPlan.duration,
      });

      if (error) throw error;

      const result = data as any;
      if (result?.success) {
        toast.success(`Successfully invested $${numAmount.toFixed(2)} in ${selectedPlan.name} plan!`);
        setSelectedPlan(null);
        setAmount("");
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result?.error || "Investment failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Investment failed");
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invest in a Plan</DialogTitle>
          <DialogDescription>
            Available balance: <span className="font-semibold text-foreground">{fmt(depositBalance)}</span>
          </DialogDescription>
        </DialogHeader>

        {!selectedPlan ? (
          <div className="space-y-3 mt-2">
            {plans.map((plan) => (
              <button
                key={plan.name}
                onClick={() => setSelectedPlan(plan)}
                className="w-full flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:bg-secondary transition-colors text-left"
              >
                <div>
                  <p className="font-semibold text-foreground">{plan.name} Plan</p>
                  <p className="text-xs text-muted-foreground">
                    {plan.dailyRate}% daily · {plan.duration} days · Min ${plan.minDeposit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-success">{plan.dailyRate}%/day</p>
                  <p className="text-xs text-muted-foreground">{plan.dailyRate * plan.duration}% total</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{selectedPlan.name} Plan</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedPlan.dailyRate}% daily · {selectedPlan.duration} days
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedPlan(null)}>
                  Change
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Investment Amount (USD)</label>
              <Input
                type="number"
                min={selectedPlan.minDeposit}
                max={depositBalance}
                step="0.01"
                placeholder={`Min $${selectedPlan.minDeposit}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1"
              />
              <div className="mt-2 flex gap-2">
                {[selectedPlan.minDeposit, Math.floor(depositBalance * 0.5), depositBalance].map((v, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setAmount(v.toFixed(2))}
                    disabled={v < selectedPlan.minDeposit || v > depositBalance}
                  >
                    {i === 0 ? "Min" : i === 1 ? "50%" : "Max"}
                  </Button>
                ))}
              </div>
            </div>

            {amount && parseFloat(amount) >= selectedPlan.minDeposit && (
              <div className="rounded-lg bg-secondary p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Profit</span>
                  <span className="text-success font-medium">
                    {fmt(parseFloat(amount) * selectedPlan.dailyRate / 100)}/day
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Profit (30 days)</span>
                  <span className="text-success font-medium">
                    {fmt(parseFloat(amount) * selectedPlan.dailyRate / 100 * selectedPlan.duration)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Capital Return</span>
                  <span className="text-foreground font-medium">{fmt(parseFloat(amount))}</span>
                </div>
              </div>
            )}

            <Button className="w-full" onClick={handleInvest} disabled={loading}>
              {loading ? <Loader2 className="animate-spin h-4 w-4" /> : (
                <>
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Invest Now
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InvestDialog;
