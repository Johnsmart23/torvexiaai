import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type InvestmentPlan = Database["public"]["Tables"]["investment_plans"]["Row"];

export const useInvestmentPlans = ({ includeInactive = false }: { includeInactive?: boolean } = {}) => {
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchPlans = async () => {
      let query = supabase
        .from("investment_plans")
        .select("*")
        .order("min_deposit", { ascending: true });
      if (!includeInactive) query = query.eq("is_active", true);

      const { data, error } = await query;
      if (!active) return;
      if (error) {
        setErrorMessage(error.message);
        toast.error(`Failed to load investment plans: ${error.message}`);
      } else {
        setPlans(data);
        setErrorMessage(null);
      }
      setLoading(false);
    };

    void fetchPlans();
    return () => {
      active = false;
    };
  }, [includeInactive]);

  return { plans, loading, errorMessage };
};
