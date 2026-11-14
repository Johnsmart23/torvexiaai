import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }

    const check = async () => {
      setLoading(true);
      const [adminResult, superAdminResult] = await Promise.all([
        supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
        supabase.rpc("is_super_admin", { p_user_id: user.id }),
      ]);
      setIsAdmin(!adminResult.error && adminResult.data === true);
      setIsSuperAdmin(!superAdminResult.error && superAdminResult.data === true);
      setLoading(false);
    };

    void check();
  }, [user]);

  return { isAdmin, isSuperAdmin, loading };
};
