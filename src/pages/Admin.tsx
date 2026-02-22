import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Users,
  DollarSign,
  BarChart3,
  LogOut,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  Ban,
} from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  kyc_status: string;
  is_admin: boolean;
  created_at: string;
  referral_code: string | null;
  avatar_url: string | null;
}

const kycColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/30",
  approved: "bg-success/10 text-success border-success/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
};

const Admin = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"users" | "finance" | "plans">("users");
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load users");
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  };

  const updateKyc = async (profileId: string, status: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ kyc_status: status })
      .eq("id", profileId);
    if (error) {
      toast.error("Failed to update KYC status");
    } else {
      toast.success(`KYC ${status}`);
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, kyc_status: status } : p))
      );
    }
  };

  const filtered = profiles.filter((p) => {
    const q = search.toLowerCase();
    return (
      !q ||
      p.full_name?.toLowerCase().includes(q) ||
      p.phone?.toLowerCase().includes(q) ||
      p.user_id.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: profiles.length,
    kycPending: profiles.filter((p) => p.kyc_status === "pending").length,
    kycApproved: profiles.filter((p) => p.kyc_status === "approved").length,
  };

  const tabs = [
    { key: "users" as const, label: "User Management", icon: Users },
    { key: "finance" as const, label: "Financial Overview", icon: DollarSign },
    { key: "plans" as const, label: "Plan Management", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive">
              <Shield className="h-4 w-4 text-destructive-foreground" />
            </div>
            <span className="font-bold text-foreground">Admin Panel</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">Dashboard</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Users</span>
              <Users className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">KYC Pending</span>
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{stats.kycPending}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">KYC Approved</span>
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{stats.kycApproved}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="sm" onClick={fetchProfiles}>
                Refresh
              </Button>
            </div>

            {loading ? (
              <p className="text-muted-foreground text-sm py-8 text-center">Loading users...</p>
            ) : (
              <div className="space-y-3">
                {filtered.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                      {p.full_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{p.full_name || "No name"}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.phone || "No phone"}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(p.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className={kycColors[p.kyc_status] || ""}>
                      {p.kyc_status}
                    </Badge>
                    <div className="flex gap-1">
                      {p.kyc_status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-success border-success/30 hover:bg-success/10"
                            onClick={() => updateKyc(p.id, "approved")}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() => updateKyc(p.id, "rejected")}
                          >
                            <XCircle className="h-3 w-3 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                      {p.kyc_status === "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => updateKyc(p.id, "rejected")}
                        >
                          <Ban className="h-3 w-3 mr-1" /> Revoke
                        </Button>
                      )}
                      {p.kyc_status === "rejected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-success border-success/30 hover:bg-success/10"
                          onClick={() => updateKyc(p.id, "approved")}
                        >
                          <UserCheck className="h-3 w-3 mr-1" /> Re-approve
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <p className="text-muted-foreground text-sm py-8 text-center">No users found.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Finance Tab */}
        {activeTab === "finance" && (
          <div className="rounded-xl border border-border bg-card p-8 shadow-card text-center">
            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold text-foreground">Financial Dashboard</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Deposit/withdrawal approvals and platform revenue tracking will be available once the wallet system is built.
            </p>
          </div>
        )}

        {/* Plans Tab */}
        {activeTab === "plans" && (
          <div className="rounded-xl border border-border bg-card p-8 shadow-card text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold text-foreground">Plan Management</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Add, pause, and configure investment plans here once the plans database is set up.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
