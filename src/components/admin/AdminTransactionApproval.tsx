import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const AdminTransactionApproval = () => {
  const { user } = useAuth();
  const [pendingTx, setPendingTx] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setPendingTx(data || []);
    setLoading(false);
  };

  const approveTransaction = async (tx: any) => {
    if (!user) return;
    setProcessing(tx.id);

    if (tx.transaction_type === "deposit") {
      const { data, error } = await supabase.rpc("approve_deposit", {
        p_transaction_id: tx.id,
        p_admin_id: user.id,
      });
      if (error || !(data as any)?.success) {
        toast.error((data as any)?.error || "Failed to approve deposit");
      } else {
        toast.success("Deposit approved & wallet credited");
      }
    } else if (tx.transaction_type === "withdrawal") {
      const { data, error } = await supabase.rpc("approve_withdrawal", {
        p_transaction_id: tx.id,
        p_admin_id: user.id,
      });
      if (error || !(data as any)?.success) {
        toast.error((data as any)?.error || "Failed to approve withdrawal");
      } else {
        toast.success("Withdrawal approved & wallet debited");
      }
    } else {
      // Generic approval for other types
      await supabase
        .from("transactions")
        .update({ status: "completed", approved_by: user.id })
        .eq("id", tx.id);
      toast.success("Transaction approved");
    }

    setProcessing(null);
    fetchPending();
  };

  const rejectTransaction = async (tx: any) => {
    if (!user) return;
    setProcessing(tx.id);
    await supabase
      .from("transactions")
      .update({ status: "rejected", approved_by: user.id })
      .eq("id", tx.id);
    toast.success("Transaction rejected");
    setProcessing(null);
    fetchPending();
  };

  if (loading) {
    return <p className="text-muted-foreground text-sm py-8 text-center">Loading transactions...</p>;
  }

  const deposits = pendingTx.filter((t) => t.transaction_type === "deposit");
  const withdrawals = pendingTx.filter((t) => t.transaction_type === "withdrawal");
  const other = pendingTx.filter(
    (t) => t.transaction_type !== "deposit" && t.transaction_type !== "withdrawal"
  );

  const renderSection = (title: string, icon: any, txs: any[]) => {
    const Icon = icon;
    if (txs.length === 0) return null;
    return (
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Icon className="h-4 w-4" /> {title}
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
            {txs.length}
          </Badge>
        </h3>
        <div className="space-y-2">
          {txs.map((tx) => (
            <div
              key={tx.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-card"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground capitalize">
                  {tx.transaction_type.replace("_", " ")}
                </p>
                <p className="text-xs text-muted-foreground">User: {tx.user_id.slice(0, 8)}...</p>
                {tx.description && (
                  <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">
                    {tx.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(tx.created_at).toLocaleString()}
                </p>
              </div>
              <p className="text-sm font-semibold text-foreground">{fmt(Number(tx.amount))}</p>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-success border-success/30 hover:bg-success/10"
                  disabled={processing === tx.id}
                  onClick={() => approveTransaction(tx)}
                >
                  <CheckCircle className="h-3 w-3 mr-1" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  disabled={processing === tx.id}
                  onClick={() => rejectTransaction(tx)}
                >
                  <XCircle className="h-3 w-3 mr-1" /> Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Clock className="h-5 w-5 text-warning" /> Pending Approvals
          {pendingTx.length > 0 && (
            <Badge className="bg-warning text-warning-foreground">{pendingTx.length}</Badge>
          )}
        </h3>
        <Button variant="outline" size="sm" onClick={fetchPending}>
          Refresh
        </Button>
      </div>

      {pendingTx.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">
          No pending transactions. All clear! ✅
        </p>
      ) : (
        <>
          {renderSection("Pending Deposits", ArrowDownLeft, deposits)}
          {renderSection("Pending Withdrawals", ArrowUpRight, withdrawals)}
          {renderSection("Other Pending", Clock, other)}
        </>
      )}
    </div>
  );
};

export default AdminTransactionApproval;
