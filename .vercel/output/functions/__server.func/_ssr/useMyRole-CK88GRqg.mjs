import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-DVFnSlur.mjs";
function useMyRole() {
  return useQuery({
    queryKey: ["my-role"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return "customer";
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      const roles = (data ?? []).map((r) => r.role);
      if (roles.includes("admin")) return "admin";
      if (roles.includes("vendor")) return "vendor";
      if (roles.includes("rider")) return "rider";
      return "customer";
    },
    staleTime: 5 * 60 * 1e3
  });
}
function homeForRole(role) {
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
export {
  homeForRole as h,
  useMyRole as u
};
