import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";

type PaymentMethod = Database["public"]["Tables"]["payment_methods"]["Row"];

const emptyForm = {
  name: "",
  asset: "",
  network: "",
  wallet_address: "",
  instructions: "",
};

const AdminPaymentMethodManagement = () => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void fetchMethods();
  }, []);

  const fetchMethods = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to load payment methods");
    } else {
      setMethods(data);
    }
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (method: PaymentMethod) => {
    setEditing(method);
    setForm({
      name: method.name,
      asset: method.asset,
      network: method.network,
      wallet_address: method.wallet_address,
      instructions: method.instructions || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      name: form.name.trim(),
      asset: form.asset.trim(),
      network: form.network.trim(),
      wallet_address: form.wallet_address.trim(),
      instructions: form.instructions.trim() || null,
    };

    if (!payload.name || !payload.asset || !payload.network || !payload.wallet_address) {
      toast.error("Fill all required fields");
      return;
    }

    setSubmitting(true);
    const { error } = editing
      ? await supabase.from("payment_methods").update(payload).eq("id", editing.id)
      : await supabase.from("payment_methods").insert(payload);

    if (error) {
      toast.error(editing ? "Failed to update payment method" : "Failed to add payment method");
    } else {
      toast.success(editing ? "Payment method updated" : "Payment method added");
      setDialogOpen(false);
      await fetchMethods();
    }
    setSubmitting(false);
  };

  const toggleActive = async (method: PaymentMethod) => {
    const { error } = await supabase
      .from("payment_methods")
      .update({ is_active: !method.is_active })
      .eq("id", method.id);

    if (error) {
      toast.error("Failed to update payment method");
    } else {
      toast.success(method.is_active ? "Payment method deactivated" : "Payment method activated");
      await fetchMethods();
    }
  };

  const deleteMethod = async (method: PaymentMethod) => {
    if (!confirm(`Delete "${method.name}"? This will remove it from the deposit options.`)) return;

    const { error } = await supabase.from("payment_methods").delete().eq("id", method.id);
    if (error) {
      toast.error("Failed to delete payment method");
    } else {
      toast.success("Payment method deleted");
      await fetchMethods();
    }
  };

  if (loading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Loading payment methods...</p>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Payment Methods</h3>
          <p className="text-sm text-muted-foreground">Manage the options shown to users when they deposit.</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" /> Add Method
        </Button>
      </div>

      <div className="space-y-3">
        {methods.map((method) => (
          <div
            key={method.id}
            className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-card"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">{method.name}</p>
              <p className="break-all text-sm text-muted-foreground">
                {method.asset} · {method.network} · {method.wallet_address}
              </p>
            </div>
            <Badge
              variant="outline"
              className={
                method.is_active
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-border bg-muted text-muted-foreground"
              }
            >
              {method.is_active ? "Active" : "Inactive"}
            </Badge>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => openEdit(method)} aria-label={`Edit ${method.name}`}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => toggleActive(method)}>
                {method.is_active ? "Deactivate" : "Activate"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => deleteMethod(method)}
                aria-label={`Delete ${method.name}`}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
        {methods.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No payment methods configured.</p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Payment Method" : "Add Payment Method"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="payment-name">Display name *</Label>
              <Input
                id="payment-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="e.g. Bitcoin"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="payment-asset">Asset / currency *</Label>
                <Input
                  id="payment-asset"
                  value={form.asset}
                  onChange={(event) => setForm({ ...form, asset: event.target.value })}
                  placeholder="e.g. BTC or USD"
                />
              </div>
              <div>
                <Label htmlFor="payment-network">Network / provider *</Label>
                <Input
                  id="payment-network"
                  value={form.network}
                  onChange={(event) => setForm({ ...form, network: event.target.value })}
                  placeholder="e.g. Bitcoin or PayPal"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="payment-destination">Wallet address / payment destination *</Label>
              <Input
                id="payment-destination"
                value={form.wallet_address}
                onChange={(event) => setForm({ ...form, wallet_address: event.target.value })}
                placeholder="Wallet address, email, or payment link"
              />
            </div>
            <div>
              <Label htmlFor="payment-instructions">Payment instructions</Label>
              <Textarea
                id="payment-instructions"
                value={form.instructions}
                onChange={(event) => setForm({ ...form, instructions: event.target.value })}
                placeholder="Optional instructions for users"
              />
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save Changes" : "Add Payment Method"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPaymentMethodManagement;
