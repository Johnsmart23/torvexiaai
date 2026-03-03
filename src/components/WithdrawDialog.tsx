import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ArrowUpRight, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  withdrawableBalance: number;
  onSuccess: () => void;
}

const WithdrawDialog = ({ open, onOpenChange, withdrawableBalance, onSuccess }: WithdrawDialogProps) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [network, setNetwork] = useState("TRC-20");
  const [submitting, setSubmitting] = useState(false);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  const handleSubmit = async () => {
    if (!user) return;
    const amt = parseFloat(amount);

    if (isNaN(amt) || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amt < 10) {
      toast.error("Minimum withdrawal is $10");
      return;
    }
    if (amt > withdrawableBalance) {
      toast.error(`Insufficient balance. You have ${fmt(withdrawableBalance)}`);
      return;
    }
    if (!walletAddress.trim() || walletAddress.trim().length < 10) {
      toast.error("Enter a valid wallet address");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      wallet_type: "withdrawable" as const,
      transaction_type: "withdrawal" as const,
      amount: amt,
      status: "pending" as const,
      description: `Withdrawal to ${walletAddress.trim()} (${network})`,
    });

    if (error) {
      toast.error("Failed to submit withdrawal request");
    } else {
      toast.success("Withdrawal request submitted! Awaiting admin approval.");
      onSuccess();
      resetAndClose();
    }
    setSubmitting(false);
  };

  const resetAndClose = () => {
    setAmount("");
    setWalletAddress("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-primary" />
            Withdraw Funds
          </DialogTitle>
          <DialogDescription>
            Request a withdrawal from your withdrawable wallet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Available Balance</p>
            <p className="text-lg font-bold text-foreground">{fmt(withdrawableBalance)}</p>
          </div>

          {withdrawableBalance < 10 && (
            <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Minimum withdrawal is $10. Your withdrawable balance is too low.
              </p>
            </div>
          )}

          <div>
            <Label>Amount (USD)</Label>
            <Input
              type="number"
              min="10"
              max={withdrawableBalance}
              placeholder="e.g. 50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">Minimum: $10</p>
          </div>

          <div>
            <Label>Your Wallet Address</Label>
            <Input
              placeholder="Enter your USDT wallet address"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
            />
          </div>

          <div>
            <Label>Network</Label>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="TRC-20">TRC-20 (Tron)</option>
              <option value="ERC-20">ERC-20 (Ethereum)</option>
              <option value="BEP-20">BEP-20 (BSC)</option>
            </select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={resetAndClose}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={submitting || withdrawableBalance < 10}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Request Withdrawal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawDialog;
