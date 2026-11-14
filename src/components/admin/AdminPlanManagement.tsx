import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  daily_rate: number;
  min_deposit: number;
  max_deposit: number | null;
  referral_bonus: number;
  is_active: boolean;
  created_at: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const emptyForm = {
  name: "",
  min_deposit: "",
  max_deposit: "",
  referral_bonus: "0",
};

const AdminPlanManagement = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("investment_plans")
      .select("*")
      .order("min_deposit", { ascending: true });
    if (error) toast.error("Failed to load plans");
    else setPlans(data || []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditing(plan);
    setForm({
      name: plan.name,
      min_deposit: plan.min_deposit.toString(),
      max_deposit: plan.max_deposit?.toString() || "",
      referral_bonus: plan.referral_bonus.toString(),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.min_deposit) {
      toast.error("Fill all required fields");
      return;
    }

    setSubmitting(true);
    const payload = {
      name: form.name.trim(),
      daily_rate: 10,
      min_deposit: parseFloat(form.min_deposit),
      max_deposit: form.max_deposit ? parseFloat(form.max_deposit) : null,
      referral_bonus: parseFloat(form.referral_bonus) || 0,
    };

    if (editing) {
      const { error } = await supabase
        .from("investment_plans")
        .update(payload)
        .eq("id", editing.id);
      if (error) toast.error("Failed to update plan");
      else {
        toast.success("Plan updated");
        fetchPlans();
        setDialogOpen(false);
      }
    } else {
      const { error } = await supabase.from("investment_plans").insert(payload);
      if (error) toast.error("Failed to create plan");
      else {
        toast.success("Plan created");
        fetchPlans();
        setDialogOpen(false);
      }
    }
    setSubmitting(false);
  };

  const toggleActive = async (plan: Plan) => {
    const { error } = await supabase
      .from("investment_plans")
      .update({ is_active: !plan.is_active })
      .eq("id", plan.id);
    if (error) toast.error("Failed to update");
    else {
      toast.success(plan.is_active ? "Plan paused" : "Plan activated");
      fetchPlans();
    }
  };

  const deletePlan = async (plan: Plan) => {
    if (!confirm(`Delete "${plan.name}" plan?`)) return;
    const { error } = await supabase
      .from("investment_plans")
      .delete()
      .eq("id", plan.id);
    if (error) toast.error("Failed to delete plan");
    else {
      toast.success("Plan deleted");
      fetchPlans();
    }
  };

  if (loading) {
    return <p className="text-muted-foreground text-sm py-8 text-center">Loading plans...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Investment Plans</h3>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> New Plan
        </Button>
      </div>

      <div className="space-y-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-card"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">{plan.name}</p>
              <p className="text-sm text-muted-foreground">
                10% daily · Ongoing · Min {fmt(plan.min_deposit)}
                {plan.max_deposit ? ` · Max ${fmt(plan.max_deposit)}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                Referral bonus: {plan.referral_bonus}%
              </p>
            </div>
            <Badge
              variant="outline"
              className={
                plan.is_active
                  ? "bg-success/10 text-success border-success/30"
                  : "bg-muted text-muted-foreground border-border"
              }
            >
              {plan.is_active ? "Active" : "Paused"}
            </Badge>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => openEdit(plan)}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggleActive(plan)}
              >
                {plan.is_active ? "Pause" : "Activate"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => deletePlan(plan)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
        {plans.length === 0 && (
          <p className="text-muted-foreground text-sm py-8 text-center">No plans yet.</p>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Plan" : "Create Plan"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Plan Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Platinum" />
            </div>
            <p className="text-sm text-muted-foreground">Daily interest is fixed at 10% for all plans.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Min Deposit ($) *</Label>
                <Input type="number" value={form.min_deposit} onChange={(e) => setForm({ ...form, min_deposit: e.target.value })} />
              </div>
              <div>
                <Label>Max Deposit ($)</Label>
                <Input type="number" value={form.max_deposit} onChange={(e) => setForm({ ...form, max_deposit: e.target.value })} placeholder="No limit" />
              </div>
            </div>
            <div>
              <Label>Referral Bonus (%)</Label>
              <Input type="number" step="0.1" value={form.referral_bonus} onChange={(e) => setForm({ ...form, referral_bonus: e.target.value })} />
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
              {editing ? "Save Changes" : "Create Plan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPlanManagement;
