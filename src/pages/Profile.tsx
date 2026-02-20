import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Shield,
  LogOut,
  User,
  Phone,
  Mail,
  BadgeCheck,
  Copy,
  Loader2,
  ArrowLeft,
  UserCheck,
} from "lucide-react";

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [kycStatus, setKycStatus] = useState("pending");
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone, kyc_status, referral_code")
        .eq("user_id", user.id)
        .single();
      if (!error && data) {
        setFullName(data.full_name ?? "");
        setPhone(data.phone ?? "");
        setKycStatus(data.kyc_status ?? "pending");
        setReferralCode(data.referral_code ?? "");
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone })
      .eq("user_id", user.id);
    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated successfully");
    }
    setSaving(false);
  };

  const copyReferral = () => {
    if (!referralCode) return;
    const link = `${window.location.origin}/register?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success("Referral link copied!");
  };

  const kycBadge = {
    pending: { label: "Pending", class: "text-warning bg-warning/10 border-warning/30" },
    verified: { label: "Verified", class: "text-success bg-success/10 border-success/30" },
    rejected: { label: "Rejected", class: "text-destructive bg-destructive/10 border-destructive/30" },
  }[kycStatus] ?? { label: kycStatus, class: "text-muted-foreground bg-muted" };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">VaultEdge</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => { await signOut(); navigate("/"); }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-2xl px-4 py-10">
        {/* Avatar / name header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/20">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{fullName || "Your Profile"}</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {/* KYC status banner */}
        {kycStatus !== "verified" && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/5 p-3">
            <UserCheck className="h-5 w-5 text-warning shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">KYC Verification Pending</p>
              <p className="text-xs text-muted-foreground">Complete verification to enable withdrawals.</p>
            </div>
            <Button size="sm" variant="outline">Verify Now</Button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Edit profile */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h2 className="mb-4 font-semibold text-foreground">Personal Information</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <User className="h-4 w-4 text-muted-foreground" /> Full Name
                  </label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Phone className="h-4 w-4 text-muted-foreground" /> Phone Number
                  </label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Mail className="h-4 w-4 text-muted-foreground" /> Email Address
                  </label>
                  <Input value={user?.email ?? ""} disabled className="opacity-60" />
                  <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed here.</p>
                </div>
                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Changes
                </Button>
              </form>
            </div>

            {/* Account info */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h2 className="mb-4 font-semibold text-foreground">Account Details</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BadgeCheck className="h-4 w-4" /> KYC Status
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${kycBadge.class}`}>
                    {kycBadge.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" /> Referral Code
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-muted px-2 py-0.5 text-sm font-mono text-foreground">
                      {referralCode || "—"}
                    </code>
                    {referralCode && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyReferral}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h2 className="mb-4 font-semibold text-foreground">Security</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Password</p>
                  <p className="text-xs text-muted-foreground">Change your account password</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/reset-password">Change Password</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
