import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
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

type PaymentMethod = Database["public"]["Tables"]["payment_methods"]["Row"];

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const DepositDialog = ({ open, onOpenChange, onSuccess }: DepositDialogProps) => {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;

    const loadPaymentMethods = async () => {
      setLoadingMethods(true);
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) {
        toast.error("Failed to load payment methods");
        setPaymentMethods([]);
        setSelectedMethodId("");
      } else {
        setPaymentMethods(data);
        setSelectedMethodId((current) =>
          data.some((method) => method.id === current) ? current : data[0]?.id || "",
        );
      }
      setLoadingMethods(false);
    };

    void loadPaymentMethods();
  }, [open]);

  const selectedMethod = paymentMethods.find((method) => method.id === selectedMethodId);

  const copyAddress = async () => {
    if (!selectedMethod) return;
    try {
      await navigator.clipboard.writeText(selectedMethod.wallet_address);
      setCopied(true);
      toast.success("Payment destination copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy payment destination");
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!txHash.trim()) {
      toast.error("Enter the transaction ID or payment reference");
      return;
    }
    if (!selectedMethod) {
      toast.error("Select an available payment method");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      wallet_type: "deposit" as const,
      transaction_type: "deposit" as const,
      amount: amt,
      status: "pending" as const,
      description: `Deposit via ${selectedMethod.name} (${selectedMethod.asset}, ${selectedMethod.network}) to ${selectedMethod.wallet_address}. Reference: ${txHash.trim()}`,
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
            Choose a payment method, send your payment, then submit its transaction ID or reference.
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="deposit-amount">Amount (USD)</Label>
              <Input
                id="deposit-amount"
                type="number"
                min="10"
                placeholder="e.g. 100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Minimum deposit: $10
              </p>
            </div>

            {loadingMethods ? (
              <div className="flex items-center justify-center gap-2 rounded-lg border border-border p-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading payment methods...
              </div>
            ) : paymentMethods.length === 0 ? (
              <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                No payment methods are currently available. Please contact support.
              </p>
            ) : (
              <>
                <div>
                  <Label htmlFor="payment-method">Payment method</Label>
                  <select
                    id="payment-method"
                    value={selectedMethodId}
                    onChange={(event) => {
                      setSelectedMethodId(event.target.value);
                      setCopied(false);
                    }}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  >
                    {paymentMethods.map((method) => (
                      <option key={method.id} value={method.id}>{method.name}</option>
                    ))}
                  </select>
                </div>

                {selectedMethod && (
                  <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">Asset / currency</p>
                        <p className="text-sm font-medium text-foreground">{selectedMethod.asset}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">Network / provider</p>
                        <p className="text-sm font-medium text-foreground">{selectedMethod.network}</p>
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">Wallet address / payment destination</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 break-all rounded border border-border bg-background px-3 py-2 text-xs text-foreground">
                          {selectedMethod.wallet_address}
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
                    {selectedMethod.instructions && (
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground">{selectedMethod.instructions}</p>
                    )}
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={() => {
                    const amt = parseFloat(amount);
                    if (isNaN(amt) || amt < 10) {
                      toast.error("Minimum deposit is $10");
                      return;
                    }
                    if (!selectedMethod) {
                      toast.error("Select an available payment method");
                      return;
                    }
                    setStep(2);
                  }}
                  disabled={!selectedMethod}
                >
                  I've Sent the Payment
                </Button>
              </>
            )}
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
              <Label htmlFor="transaction-reference">Transaction ID / payment reference</Label>
              <Input
                id="transaction-reference"
                placeholder="Paste your transaction hash here"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Find this in your transaction history or payment confirmation after sending.
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
