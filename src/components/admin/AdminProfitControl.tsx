import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Pause, Play, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const AdminProfitControl = () => {
  const [profitsPaused, setProfitsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("investment_settings")
      .select("profits_paused")
      .eq("id", 1)
      .single();

    if (error) {
      toast.error("Failed to load profit settings");
      setLoadError(true);
    } else {
      setProfitsPaused(data.profits_paused);
      setLoadError(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchSettings();
  }, []);

  const toggleProfits = async () => {
    setUpdating(true);
    const { data, error } = await supabase.rpc("set_investment_profits_paused", {
      p_paused: !profitsPaused,
    });

    if (error) {
      toast.error("Failed to update profit settings");
    } else {
      const result = data as { success?: boolean; paused?: boolean; error?: string };
      if (!result.success) {
        toast.error(result.error || "Failed to update profit settings");
      } else {
        setProfitsPaused(result.paused ?? !profitsPaused);
        toast.success(result.paused ? "Daily profits paused" : "Daily profits resumed");
      }
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading profit settings...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-2xl rounded-xl border border-destructive/30 bg-card p-6 shadow-card">
        <p className="text-sm text-destructive">Profit settings could not be loaded. The current status is unknown.</p>
        <Button className="mt-4" variant="outline" onClick={() => {
          setLoading(true);
          void fetchSettings();
        }}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-start gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${profitsPaused ? "bg-warning/10" : "bg-success/10"}`}>
          <TrendingUp className={`h-5 w-5 ${profitsPaused ? "text-warning" : "text-success"}`} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">Daily Profit Control</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {profitsPaused
              ? "Daily interest is paused for all active investments. No profits accrue while paused."
              : "Daily interest is accruing on active investments at the configured rate."}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Resuming skips paused days. Interest starts accruing again on the next scheduled daily run.
            New investments are currently dormant.
          </p>
          <Button
            className="mt-5"
            variant={profitsPaused ? "default" : "outline"}
            onClick={() => void toggleProfits()}
            disabled={updating}
          >
            {updating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : profitsPaused ? (
              <Play className="mr-2 h-4 w-4" />
            ) : (
              <Pause className="mr-2 h-4 w-4" />
            )}
            {profitsPaused ? "Resume Profits" : "Pause Profits"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminProfitControl;
