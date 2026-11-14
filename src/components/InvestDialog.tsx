import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
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

type InvestmentPlan = Database["public"]["Tables"]["investment_plans"]["Row"];

const DAILY_INTEREST_RATE = 10;

interface InvestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  depositBalance: number;
  onSuccess: () => void;
}

const InvestDialog = ({ open, onOpenChange, depositBalance, onSuccess }: InvestDialogProps) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const fetchPlans = async () => {
      setPlansLoading(true);
      const { data, error } = await supabase
        .from("investment_plans")
        .select("*")
        .eq("is_active", true)
        .order("min_deposit", { ascending: true });

      if (error) {
        toast.error("Failed to load investment plans");
        setPlans([]);
      } else {
        setPlans(data);
      }
      setPlansLoading(false);
    };

    void fetchPlans();
  }, [open]);

  const handleInvest = async () => {
    if (!user || !selectedPlan) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (numAmount < selectedPlan.min_deposit) {
      toast.error(`Minimum investment for ${selectedPlan.name} is $${selectedPlan.min_deposit}`);
      return;
    }
    if (selectedPlan.max_deposit !== null && numAmount > selectedPlan.max_deposit) {
      toast.error(`Maximum investment for ${selectedPlan.name} is $${selectedPlan.max_deposit}`);
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
        p_daily_rate: DAILY_INTEREST_RATE,
        p_duration_days: selectedPlan.duration_days,
      });

      if (error) throw error;

      const result = data as { success?: boolean; error?: string } | null;
      if (result?.success) {
        toast.success(`Successfully invested $${numAmount.toFixed(2)} in ${selectedPlan.name} plan!`);
        setSelectedPlan(null);
        setAmount("");
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result?.error || "Investment failed");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Investment failed");
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
            {plansLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading plans...
              </div>
            ) : plans.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No active investment plans are available.</p>
            ) : plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className="w-full flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:bg-secondary transition-colors text-left"
              >
                <div>
                  <p className="font-semibold text-foreground">{plan.name} Plan</p>
                  <p className="text-xs text-muted-foreground">
                    {DAILY_INTEREST_RATE}% daily · {plan.duration_days} days · Min ${plan.min_deposit}
                    {plan.max_deposit !== null ? ` · Max $${plan.max_deposit}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-success">{DAILY_INTEREST_RATE}%/day</p>
                  <p className="text-xs text-muted-foreground">{DAILY_INTEREST_RATE * plan.duration_days}% total</p>
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
                    {DAILY_INTEREST_RATE}% daily · {selectedPlan.duration_days} days
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
                min={selectedPlan.min_deposit}
                max={Math.min(depositBalance, selectedPlan.max_deposit ?? depositBalance)}
                step="0.01"
                placeholder={`Min $${selectedPlan.min_deposit}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1"
              />
              <div className="mt-2 flex gap-2">
                {[
                  selectedPlan.min_deposit,
                  Math.floor(depositBalance * 0.5),
                  Math.min(depositBalance, selectedPlan.max_deposit ?? depositBalance),
                ].map((v, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setAmount(v.toFixed(2))}
                    disabled={
                      v < selectedPlan.min_deposit ||
                      v > depositBalance ||
                      (selectedPlan.max_deposit !== null && v > selectedPlan.max_deposit)
                    }
                  >
                    {i === 0 ? "Min" : i === 1 ? "50%" : "Max"}
                  </Button>
                ))}
              </div>
            </div>

            {amount && parseFloat(amount) >= selectedPlan.min_deposit && (
              <div className="rounded-lg bg-secondary p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Profit</span>
                  <span className="text-success font-medium">
                    {fmt(parseFloat(amount) * DAILY_INTEREST_RATE / 100)}/day
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Profit ({selectedPlan.duration_days} days)</span>
                  <span className="text-success font-medium">
                    {fmt(parseFloat(amount) * DAILY_INTEREST_RATE / 100 * selectedPlan.duration_days)}
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
