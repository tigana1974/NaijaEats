import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "customer" | "vendor" | "rider" | "admin";

export function useMyRole() {
  return useQuery({
    queryKey: ["my-role"],
    queryFn: async (): Promise<AppRole> => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return "customer";
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid);
      const roles = (data ?? []).map((r: any) => r.role as AppRole);
      if (roles.includes("admin")) return "admin";
      if (roles.includes("vendor")) return "vendor";
      if (roles.includes("rider")) return "rider";
      return "customer";
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function homeForRole(role: AppRole | undefined): string {
  switch (role) {
    case "vendor":
      return "/vendor/dashboard";
    case "rider":
      return "/rider/dashboard";
    case "admin":
      return "/admin/dashboard";
    default:
      return "/discover";
  }
}