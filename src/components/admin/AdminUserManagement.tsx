import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/use-admin";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  CheckCircle,
  XCircle,
  UserCheck,
  Ban,
  Clock,
  ChevronDown,
  ChevronUp,
  Wallet,
  Send,
  Loader2,
  Trash2,
  FileText,
  ExternalLink,
  ShieldCheck,
  ShieldOff,
  Mail,
  MailCheck,
} from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  phone: string | null;
  country: string | null;
  kyc_status: string;
  kyc_document_url: string | null;
  kyc_rejection_reason: string | null;
  is_admin: boolean;
  is_suspended: boolean;
  created_at: string;
  referral_code: string | null;
}

interface ActivationPlan {
  id: string;
  name: string;
  min_deposit: number;
  max_deposit: number | null;
}

interface UserWallet {
  id: string;
  wallet_type: string;
  balance: number;
}

const kycColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/30",
  approved: "bg-success/10 text-success border-success/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const AdminUserManagement = () => {
  const { user: adminUser } = useAuth();
  const { isSuperAdmin } = useAdmin();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [resettingPasswordUserId, setResettingPasswordUserId] = useState<string | null>(null);
  const [resendingConfirmationUserId, setResendingConfirmationUserId] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userWallets, setUserWallets] = useState<UserWallet[]>([]);
  const [userTxs, setUserTxs] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  // Transfer dialog
  const [transferTarget, setTransferTarget] = useState<UserProfile | null>(null);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [transferring, setTransferring] = useState(false);
  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  // KYC rejection dialog
  const [rejectTarget, setRejectTarget] = useState<UserProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  // Deposit to Interest transfer
  const [interestTransferTarget, setInterestTransferTarget] = useState<UserProfile | null>(null);
  const [interestTransferAmount, setInterestTransferAmount] = useState("");
  const [interestTransferNote, setInterestTransferNote] = useState("");
  const [interestTransferring, setInterestTransferring] = useState(false);
  // Investment activation
  const [activationTarget, setActivationTarget] = useState<UserProfile | null>(null);
  const [activationPlans, setActivationPlans] = useState<ActivationPlan[]>([]);
  const [activationPlanId, setActivationPlanId] = useState("");
  const [activationAmount, setActivationAmount] = useState("");
  const [loadingActivationPlans, setLoadingActivationPlans] = useState(false);
  const [activatingInvestment, setActivatingInvestment] = useState(false);

  useEffect(() => { fetchProfiles(); }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    const profilesResult = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (profilesResult.error) toast.error(profilesResult.error.message || "Failed to load users");
    else setProfiles((profilesResult.data as any) || []);
    setLoading(false);
  };

  const updateKyc = async (profileId: string, status: string, reason?: string) => {
    const updateData: any = { kyc_status: status };
    if (reason !== undefined) updateData.kyc_rejection_reason = reason;
    if (status === "approved") updateData.kyc_rejection_reason = null;

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", profileId);
    if (error) toast.error("Failed to update KYC");
    else {
      toast.success(`KYC ${status}`);
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, kyc_status: status, kyc_rejection_reason: status === "approved" ? null : (reason ?? p.kyc_rejection_reason) } : p))
      );
    }
  };

  const handleReject = (p: UserProfile) => {
    setRejectTarget(p);
    setRejectionReason("");
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    await updateKyc(rejectTarget.id, "rejected", rejectionReason.trim() || undefined);
    setRejectTarget(null);
    setRejectionReason("");
  };

  const toggleSuspend = async (profileId: string, currentlySuspended: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_suspended: !currentlySuspended })
      .eq("id", profileId);
    if (error) toast.error("Failed to update user");
    else {
      toast.success(currentlySuspended ? "User unsuspended" : "User suspended");
      setProfiles((prev) =>
        prev.map((p) => p.id === profileId ? { ...p, is_suspended: !currentlySuspended } : p)
      );
    }
  };

  const toggleExpand = async (userId: string) => {
    if (expandedUser === userId) { setExpandedUser(null); return; }
    setExpandedUser(userId);
    setDetailLoading(true);
    const [walletsRes, txRes] = await Promise.all([
      supabase.from("wallets").select("*").eq("user_id", userId),
      supabase.from("transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
    ]);
    setUserWallets(walletsRes.data || []);
    setUserTxs(txRes.data || []);
    setDetailLoading(false);
  };

  const openActivationDialog = async (profile: UserProfile) => {
    setActivationTarget(profile);
    setActivationPlans([]);
    setActivationPlanId("");
    setActivationAmount("");
    setLoadingActivationPlans(true);

    const { data, error } = await supabase
      .from("investment_plans")
      .select("id, name, min_deposit, max_deposit")
      .eq("is_active", true)
      .order("min_deposit", { ascending: true });

    if (error) {
      toast.error(error.message || "Failed to load active plans");
      setActivationTarget(null);
    } else {
      const plans = data || [];
      setActivationPlans(plans);
      setActivationPlanId(plans[0]?.id || "");
      if (plans.length === 0) toast.error("There are no active plans available");
    }
    setLoadingActivationPlans(false);
  };

  const activateInvestment = async () => {
    if (!activationTarget || !activationPlanId) return;
    const amount = Number(activationAmount);
    const plan = activationPlans.find((candidate) => candidate.id === activationPlanId);

    if (!plan || !Number.isFinite(amount) || amount <= 0) {
      toast.error("Select an active plan and enter a valid amount");
      return;
    }
    if (amount < plan.min_deposit || (plan.max_deposit !== null && amount > plan.max_deposit)) {
      toast.error(`Amount must be between ${fmt(plan.min_deposit)} and ${plan.max_deposit === null ? "no limit" : fmt(plan.max_deposit)}`);
      return;
    }

    setActivatingInvestment(true);
    const { data, error } = await supabase.rpc("admin_activate_user_investment", {
      p_user_id: activationTarget.user_id,
      p_plan_id: plan.id,
      p_amount: amount,
    });

    if (error) {
      toast.error(error.message || "Failed to activate plan");
    } else {
      const result = data as { success?: boolean; error?: string };
      if (!result.success) {
        toast.error(result.error || "Failed to activate plan");
      } else {
        toast.success(`${plan.name} plan activated for ${activationTarget.full_name || "user"}`);
        const targetUserId = activationTarget.user_id;
        setActivationTarget(null);
        setActivationPlanId("");
        setActivationAmount("");
        const [walletsRes, txRes] = await Promise.all([
          supabase.from("wallets").select("*").eq("user_id", targetUserId),
          supabase.from("transactions").select("*").eq("user_id", targetUserId)
            .order("created_at", { ascending: false }).limit(10),
        ]);
        if (walletsRes.error) toast.error(walletsRes.error.message || "Failed to refresh user wallets");
        else setUserWallets(walletsRes.data || []);
        if (txRes.error) toast.error(txRes.error.message || "Failed to refresh user transactions");
        else setUserTxs(txRes.data || []);
      }
    }
    setActivatingInvestment(false);
  };

  const handleTransfer = async () => {
    if (!adminUser || !transferTarget) return;
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) { toast.error("Enter a valid amount"); return; }
    setTransferring(true);
    try {
      const { data, error } = await supabase.rpc("admin_transfer_to_user", {
        p_admin_id: adminUser.id,
        p_user_id: transferTarget.user_id,
        p_amount: amt,
        p_note: transferNote.trim(),
      });
      if (error) { toast.error(error.message || "Transfer failed"); }
      else if (data && typeof data === "object" && !(data as any).success) { toast.error((data as any).error || "Transfer failed"); }
      else {
        toast.success(`${fmt(amt)} transferred to ${transferTarget.full_name || "user"}`);
        setTransferTarget(null); setTransferAmount(""); setTransferNote("");
        if (expandedUser === transferTarget.user_id) {
          toggleExpand(transferTarget.user_id);
          setTimeout(() => toggleExpand(transferTarget.user_id), 100);
        }
      }
    } catch (err: any) { toast.error(err?.message || "An unexpected error occurred"); }
    setTransferring(false);
  };

  const handleDelete = async () => {
    if (!adminUser || !deleteTarget) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.rpc("admin_delete_user" as any, {
        p_admin_id: adminUser.id,
        p_user_id: deleteTarget.user_id,
      });
      if (error) { toast.error(error.message || "Delete failed"); }
      else if (data && typeof data === "object" && !(data as any).success) { toast.error((data as any).error || "Delete failed"); }
      else {
        toast.success(`Account deleted for ${deleteTarget.full_name || "user"}`);
        setProfiles((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        setDeleteTarget(null); setDeleteConfirmText("");
        if (expandedUser === deleteTarget.user_id) setExpandedUser(null);
      }
    } catch (err: any) { toast.error(err?.message || "An unexpected error occurred"); }
    setDeleting(false);
  };

  const toggleAdmin = async (profile: UserProfile) => {
    if (!adminUser || !isSuperAdmin) return;
    const isCurrentlyAdmin = profile.is_admin;
    try {
      const { data, error } = await supabase.rpc("set_user_admin_role", {
        p_user_id: profile.user_id,
        p_make_admin: !isCurrentlyAdmin,
      });
      if (error) throw error;
      if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data) ||
        data.success !== true
      ) {
        const errorMessage =
          data && typeof data === "object" && !Array.isArray(data) && typeof data.error === "string"
            ? data.error
            : "Failed to update admin status";
        throw new Error(errorMessage);
      }
      if (isCurrentlyAdmin) {
        toast.success(`${profile.full_name || "User"} removed as admin`);
      } else {
        toast.success(`${profile.full_name || "User"} is now an admin`);
      }
      setProfiles((prev) => prev.map((p) => p.id === profile.id ? { ...p, is_admin: !isCurrentlyAdmin } : p));
    } catch (err: any) {
      toast.error(err?.message || "Failed to update admin status");
    }
  };

  const sendPasswordReset = async (profile: UserProfile) => {
    if (!profile.email) {
      toast.error("This user does not have an email address on their profile");
      return;
    }

    setResettingPasswordUserId(profile.user_id);
    const { data, error } = await supabase.functions.invoke("account-auth", {
      body: {
        action: "admin-reset-password",
        user_id: profile.user_id,
      },
    });

    if (error) {
      toast.error(error.message || "Failed to send password reset email");
    } else if (!data?.success) {
      toast.error(data?.error || "Failed to send password reset email");
    } else {
      toast.success(`Password reset link sent to ${profile.email}`);
    }
    setResettingPasswordUserId(null);
  };

  const resendConfirmationEmail = async (profile: UserProfile) => {
    if (!profile.email) {
      toast.error("This user does not have an email address on their profile");
      return;
    }

    setResendingConfirmationUserId(profile.user_id);
    const { data, error } = await supabase.functions.invoke("account-auth", {
      body: {
        action: "admin-resend-confirmation",
        user_id: profile.user_id,
      },
    });

    if (error) {
      toast.error(error.message || "Failed to resend confirmation email");
    } else if (!data?.success) {
      toast.error(data?.error || "Failed to resend confirmation email");
    } else {
      toast.success(`Confirmation email sent to ${profile.email}`);
    }
    setResendingConfirmationUserId(null);
  };

  const handleInterestTransfer = async () => {
    if (!adminUser || !interestTransferTarget) return;
    const amt = parseFloat(interestTransferAmount);
    if (isNaN(amt) || amt <= 0) { toast.error("Enter a valid amount"); return; }
    setInterestTransferring(true);
    try {
      const { data, error } = await supabase.rpc("admin_transfer_deposit_to_interest" as any, {
        p_admin_id: adminUser.id,
        p_user_id: interestTransferTarget.user_id,
        p_amount: amt,
        p_note: interestTransferNote.trim(),
      });
      if (error) { toast.error(error.message || "Transfer failed"); }
      else if (data && typeof data === "object" && !(data as any).success) { toast.error((data as any).error || "Transfer failed"); }
      else {
        toast.success(`${fmt(amt)} transferred from Deposit to Interest wallet`);
        setInterestTransferTarget(null); setInterestTransferAmount(""); setInterestTransferNote("");
        if (expandedUser === interestTransferTarget.user_id) {
          toggleExpand(interestTransferTarget.user_id);
          setTimeout(() => toggleExpand(interestTransferTarget.user_id), 100);
        }
      }
    } catch (err: any) { toast.error(err?.message || "An unexpected error occurred"); }
    setInterestTransferring(false);
  };

  const filtered = profiles.filter((p) => {
    const q = search.toLowerCase();
    return !q ||
      p.full_name?.toLowerCase().includes(q) ||
      p.username?.toLowerCase().includes(q) ||
      p.phone?.toLowerCase().includes(q) ||
      p.country?.toLowerCase().includes(q) ||
      p.user_id.toLowerCase().includes(q);
  });

  const stats = {
    total: profiles.length,
    kycPending: profiles.filter((p) => p.kyc_status === "pending").length,
    kycApproved: profiles.filter((p) => p.kyc_status === "approved").length,
    suspended: profiles.filter((p) => p.is_suspended).length,
  };

  return (
    <>
      <div>
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4 mb-6">
          {[
            { label: "Total Users", value: stats.total },
            { label: "KYC Pending", value: stats.kycPending },
            { label: "KYC Approved", value: stats.kycApproved },
            { label: "Suspended", value: stats.suspended },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-card text-center">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Button variant="outline" size="sm" onClick={fetchProfiles}>Refresh</Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm py-8 text-center">Loading users...</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <div key={p.id} className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
                <div className="flex flex-wrap items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                    {p.full_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {p.full_name || "No name"}
                      {p.is_admin && (
                        <Badge variant="outline" className="ml-2 bg-primary/10 text-primary border-primary/30 text-xs">Admin</Badge>
                      )}
                      {p.is_suspended && (
                        <Badge variant="outline" className="ml-2 bg-destructive/10 text-destructive border-destructive/30 text-xs">Suspended</Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{p.email || "Email unavailable"}</p>
                    {p.username && <p className="text-xs text-muted-foreground truncate">Username: {p.username}</p>}
                    <p className="text-xs text-muted-foreground truncate">{p.phone || "No phone"}</p>
                    <p className="text-xs text-muted-foreground truncate">Country: {p.country || "Not provided"}</p>
                    <p className="text-xs text-muted-foreground">Joined {new Date(p.created_at).toLocaleDateString()}</p>
                  </div>

                  {/* KYC badge + document link */}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={kycColors[p.kyc_status] || ""}>{p.kyc_status}</Badge>
                    {p.kyc_document_url && (
                      <a href={p.kyc_document_url} target="_blank" rel="noopener noreferrer" title="View KYC Document">
                        <FileText className="h-4 w-4 text-primary hover:text-primary/80" />
                      </a>
                    )}
                  </div>

                  <div className="flex gap-1 flex-wrap">
                    {p.kyc_status === "pending" && (
                      <>
                        <Button size="sm" variant="outline" className="text-success border-success/30 hover:bg-success/10" onClick={() => updateKyc(p.id, "approved")}>
                          <CheckCircle className="h-3 w-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleReject(p)}>
                          <XCircle className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                    {p.kyc_status === "approved" && (
                      <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleReject(p)}>
                        <Ban className="h-3 w-3 mr-1" /> Revoke
                      </Button>
                    )}
                    {p.kyc_status === "rejected" && (
                      <Button size="sm" variant="outline" className="text-success border-success/30 hover:bg-success/10" onClick={() => updateKyc(p.id, "approved")}>
                        <UserCheck className="h-3 w-3 mr-1" /> Re-approve
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => toggleSuspend(p.id, p.is_suspended)} className={p.is_suspended ? "text-success border-success/30" : "text-destructive border-destructive/30"}>
                      {p.is_suspended ? "Unsuspend" : "Suspend"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!p.email || resettingPasswordUserId === p.user_id}
                      onClick={() => void sendPasswordReset(p)}
                    >
                      {resettingPasswordUserId === p.user_id
                        ? <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        : <Mail className="mr-1 h-3 w-3" />}
                      Send Reset Link
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!p.email || resendingConfirmationUserId === p.user_id}
                      onClick={() => void resendConfirmationEmail(p)}
                    >
                      {resendingConfirmationUserId === p.user_id
                        ? <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        : <MailCheck className="mr-1 h-3 w-3" />}
                      Resend Confirmation
                    </Button>
                    {isSuperAdmin && adminUser?.id !== p.user_id && (
                      <Button size="sm" variant="outline" onClick={() => void toggleAdmin(p)} className={p.is_admin ? "text-warning border-warning/30 hover:bg-warning/10" : "text-primary border-primary/30 hover:bg-primary/10"}>
                        {p.is_admin ? <><ShieldOff className="h-3 w-3 mr-1" /> Remove Admin</> : <><ShieldCheck className="h-3 w-3 mr-1" /> Make Admin</>}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => { setDeleteTarget(p); setDeleteConfirmText(""); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleExpand(p.user_id)}>
                      {expandedUser === p.user_id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedUser === p.user_id && (
                  <div className="border-t border-border bg-muted/30 p-4 space-y-4">
                    {detailLoading ? (
                      <p className="text-sm text-muted-foreground text-center">Loading...</p>
                    ) : (
                      <>
                        {/* KYC Document Preview */}
                        {p.kyc_document_url && (
                          <div>
                            <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1">
                              <FileText className="h-4 w-4" /> KYC Document
                            </h4>
                            <div className="rounded-lg border border-border bg-card p-3">
                              {p.kyc_document_url.match(/\.(jpg|jpeg|png|webp)/i) ? (
                                <img src={p.kyc_document_url} alt="KYC Document" className="max-h-64 rounded-lg object-contain" />
                              ) : (
                                <a href={p.kyc_document_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                                  <ExternalLink className="h-4 w-4" /> View PDF Document
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1">
                            <Wallet className="h-4 w-4" /> Wallets
                          </h4>
                          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
                            {userWallets.map((w) => (
                              <div key={w.id} className="rounded-lg border border-border bg-card p-3 text-center">
                                <p className="text-xs text-muted-foreground capitalize">{w.wallet_type.replace("_", " ")}</p>
                                <p className="text-sm font-bold text-foreground">{fmt(Number(w.balance))}</p>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" variant="outline" className="text-primary border-primary/30 hover:bg-primary/10" onClick={() => setTransferTarget(p)}>
                              <Send className="h-3 w-3 mr-1" /> Transfer Funds
                            </Button>
                            <Button size="sm" variant="outline" className="text-accent border-accent/30 hover:bg-accent/10" onClick={() => setInterestTransferTarget(p)}>
                              <Wallet className="h-3 w-3 mr-1" /> Deposit → Interest
                            </Button>
                            <Button size="sm" variant="outline" className="text-success border-success/30 hover:bg-success/10" onClick={() => void openActivationDialog(p)}>
                              <CheckCircle className="h-3 w-3 mr-1" /> Activate Plan
                            </Button>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1">
                            <Clock className="h-4 w-4" /> Recent Transactions
                          </h4>
                          {userTxs.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No transactions</p>
                          ) : (
                            <div className="space-y-1">
                              {userTxs.map((tx: any) => (
                                <div key={tx.id} className="flex items-center gap-2 text-xs rounded-lg border border-border bg-card p-2">
                                  <span className="capitalize font-medium text-foreground">{tx.transaction_type.replace("_", " ")}</span>
                                  <span className="text-muted-foreground">•</span>
                                  <span className="font-semibold text-foreground">{fmt(Number(tx.amount))}</span>
                                  <span className="text-muted-foreground">•</span>
                                  <Badge variant="outline" className="text-[10px] py-0">{tx.status}</Badge>
                                  <span className="ml-auto text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
            {filtered.length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No users found.</p>}
          </div>
        )}
      </div>

      {/* Transfer Dialog */}
      <Dialog open={!!transferTarget} onOpenChange={(o) => { if (!o) { setTransferTarget(null); setTransferAmount(""); setTransferNote(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-primary" /> Transfer Funds to User</DialogTitle>
            <DialogDescription>Send funds from company wallet to {transferTarget?.full_name || "this user"}'s deposit wallet.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Amount (USD)</Label><Input type="number" min="1" placeholder="e.g. 500" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} /></div>
            <div><Label>Note (optional)</Label><Input placeholder="e.g. Deposit confirmation" value={transferNote} onChange={(e) => setTransferNote(e.target.value)} /></div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setTransferTarget(null); setTransferAmount(""); setTransferNote(""); }}>Cancel</Button>
              <Button className="flex-1" onClick={handleTransfer} disabled={transferring}>
                {transferring ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Send Funds
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) { setDeleteTarget(null); setDeleteConfirmText(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><Trash2 className="h-5 w-5" /> Delete User Account</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{deleteTarget?.full_name || "this user"}</strong>'s account, including all wallets, transactions, and investments. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type <strong>DELETE</strong> to confirm</Label>
              <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="DELETE" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setDeleteTarget(null); setDeleteConfirmText(""); }}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={deleting || deleteConfirmText !== "DELETE"}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Delete Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* KYC Rejection Dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => { if (!o) { setRejectTarget(null); setRejectionReason(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><XCircle className="h-5 w-5" /> Reject KYC</DialogTitle>
            <DialogDescription>Provide a reason for rejecting {rejectTarget?.full_name || "this user"}'s KYC verification.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rejection Reason (optional)</Label>
              <Input value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="e.g. Document is blurry or expired" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setRejectTarget(null); setRejectionReason(""); }}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={confirmReject}>Reject KYC</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deposit to Interest Transfer Dialog */}
      <Dialog open={!!interestTransferTarget} onOpenChange={(o) => { if (!o) { setInterestTransferTarget(null); setInterestTransferAmount(""); setInterestTransferNote(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-accent" /> Transfer Deposit → Interest</DialogTitle>
            <DialogDescription>Move funds from {interestTransferTarget?.full_name || "this user"}'s deposit wallet to their interest (profit) wallet.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">User's Deposit Balance</p>
              <p className="text-lg font-bold text-foreground">
                {fmt(Number(userWallets.find((w) => w.wallet_type === "deposit")?.balance || 0))}
              </p>
            </div>
            <div><Label>Amount (USD)</Label><Input type="number" min="1" placeholder="e.g. 100" value={interestTransferAmount} onChange={(e) => setInterestTransferAmount(e.target.value)} /></div>
            <div><Label>Note (optional)</Label><Input placeholder="e.g. Interest allocation" value={interestTransferNote} onChange={(e) => setInterestTransferNote(e.target.value)} /></div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setInterestTransferTarget(null); setInterestTransferAmount(""); setInterestTransferNote(""); }}>Cancel</Button>
              <Button className="flex-1" onClick={handleInterestTransfer} disabled={interestTransferring}>
                {interestTransferring ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Transfer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Activate a plan using the user's approved deposit balance */}
      <Dialog open={!!activationTarget} onOpenChange={(o) => {
        if (!o && !activatingInvestment) {
          setActivationTarget(null);
          setActivationPlanId("");
          setActivationAmount("");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" /> Activate User Plan
            </DialogTitle>
            <DialogDescription>
              Select a plan and amount to move from {activationTarget?.full_name || "this user's"} approved deposit balance into an active investment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Available Deposit Balance</p>
              <p className="text-lg font-bold text-foreground">
                {fmt(Number(userWallets.find((w) => w.wallet_type === "deposit")?.balance || 0))}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Investment Plan</Label>
              <Select value={activationPlanId} onValueChange={setActivationPlanId} disabled={loadingActivationPlans || activationPlans.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingActivationPlans ? "Loading plans..." : "Select a plan"} />
                </SelectTrigger>
                <SelectContent>
                  {activationPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activationPlans.length === 0 && !loadingActivationPlans && (
                <p className="text-xs text-muted-foreground">Create or activate a plan before assigning it to a user.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Investment Amount (USD)</Label>
              <Input
                type="number"
                min={activationPlans.find((plan) => plan.id === activationPlanId)?.min_deposit || 0.01}
                max={activationPlans.find((plan) => plan.id === activationPlanId)?.max_deposit ?? undefined}
                step="0.01"
                value={activationAmount}
                onChange={(e) => setActivationAmount(e.target.value)}
                placeholder="Enter amount"
                disabled={!activationPlanId}
              />
              {activationPlanId && (() => {
                const plan = activationPlans.find((candidate) => candidate.id === activationPlanId);
                return plan ? (
                  <p className="text-xs text-muted-foreground">
                    Allowed: {fmt(plan.min_deposit)} minimum{plan.max_deposit === null ? "" : `, ${fmt(plan.max_deposit)} maximum`}.
                  </p>
                ) : null;
              })()}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setActivationTarget(null)} disabled={activatingInvestment}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={() => void activateInvestment()} disabled={activatingInvestment || loadingActivationPlans || !activationPlanId}>
                {activatingInvestment ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Activate Plan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminUserManagement;
