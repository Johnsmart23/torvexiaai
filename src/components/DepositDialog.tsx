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
import { Copy, CheckCircle, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";

const CRYPTO_ADDRESS = "TXrZ1bDfhKJxMxkV5qWf3avREpSNBQPmfg";
const NETWORK = "TRC-20 (Tron)";
const COIN = "USDT";

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const DepositDialog = ({ open, onOpenChange, onSuccess }: DepositDialogProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    await navigator.clipboard.writeText(CRYPTO_ADDRESS);
    setCopied(true);
    toast.success("Address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!user) return;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!txHash.trim()) {
      toast.error("Enter the transaction hash");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      wallet_type: "deposit" as const,
      transaction_type: "deposit" as const,
      amount: amt,
      status: "pending" as const,
      description: `Deposit via ${COIN} (${NETWORK}). TX: ${txHash.trim()}`,
    });

    if (error) {
      toast.error("Failed to submit deposit request");
    } else {
      toast.success("Deposit request submitted! Awaiting admin approval.");
      onSuccess();
      resetAndClose();
    }
    setSubmitting(false);
  };

  const resetAndClose = () => {
    setStep(1);
    setAmount("");
    setTxHash("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Deposit Funds
          </DialogTitle>
          <DialogDescription>
            Send {COIN} to the address below, then submit proof of payment.
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Amount (USD)</Label>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Minimum deposit: $10
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Network</p>
                <p className="text-sm font-medium text-foreground">{NETWORK}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Coin</p>
                <p className="text-sm font-medium text-foreground">{COIN}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Wallet Address</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-background border border-border px-3 py-2 text-xs break-all text-foreground">
                    {CRYPTO_ADDRESS}
                  </code>
                  <Button variant="outline" size="icon" onClick={copyAddress} className="shrink-0">
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => {
                const amt = parseFloat(amount);
                if (isNaN(amt) || amt < 10) {
                  toast.error("Minimum deposit is $10");
                  return;
                }
                setStep(2);
              }}
            >
              I've Sent the Payment
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <p className="text-muted-foreground">
                Amount: <span className="font-semibold text-foreground">${parseFloat(amount).toFixed(2)}</span>
              </p>
            </div>

            <div>
              <Label>Transaction Hash / TX ID</Label>
              <Input
                placeholder="Paste your transaction hash here"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Find this in your wallet's transaction history after sending.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Submit Request
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DepositDialog;
