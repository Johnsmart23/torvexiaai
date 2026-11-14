import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";

interface AdminAccount {
  user_id: string;
  email: string | null;
  full_name: string | null;
  is_super_admin: boolean;
  created_at: string;
}

const AdminManagement = () => {
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_admin_roster");
    if (error) {
      toast.error(error.message || "Failed to load admins");
    } else {
      setAdmins(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchAdmins();
  }, [fetchAdmins]);

  const removeAdmin = async (admin: AdminAccount) => {
    if (admin.is_super_admin) return;
    setUpdatingUserId(admin.user_id);
    const { data, error } = await supabase.rpc("set_user_admin_role", {
      p_user_id: admin.user_id,
      p_make_admin: false,
    });

    if (error) {
      toast.error(error.message || "Failed to remove admin");
    } else if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data) ||
      data.success !== true
    ) {
      const errorMessage =
        data && typeof data === "object" && !Array.isArray(data) && typeof data.error === "string"
          ? data.error
          : "Failed to remove admin";
      toast.error(errorMessage);
    } else {
      toast.success(`${admin.full_name || admin.email || "Admin"} removed as admin`);
      setAdmins((current) => current.filter((entry) => entry.user_id !== admin.user_id));
    }
    setUpdatingUserId(null);
  };

  if (loading) {
    return <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading admins...</p>;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Admin Accounts</h2>
          <p className="text-sm text-muted-foreground">Review administrators and manage their access.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => void fetchAdmins()}>Refresh</Button>
      </div>
      {admins.length === 0 ? (
        <p className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">No admin accounts found.</p>
      ) : (
        <div className="space-y-2">
          {admins.map((admin) => (
            <div key={admin.user_id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{admin.full_name || "No name"}</p>
                <p className="truncate text-sm text-muted-foreground">{admin.email || "No email available"}</p>
              </div>
              <Badge variant="outline" className={admin.is_super_admin ? "border-primary/30 bg-primary/10 text-primary" : ""}>
                {admin.is_super_admin ? "Super Admin" : "Admin"}
              </Badge>
              {!admin.is_super_admin && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  disabled={updatingUserId === admin.user_id}
                  onClick={() => void removeAdmin(admin)}
                >
                  {updatingUserId === admin.user_id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <ShieldOff className="mr-1 h-3 w-3" />}
                  Remove Admin
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default AdminManagement;
