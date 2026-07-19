import { useEffect } from "react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { recordDeviceSession } from "@/lib/device";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth" });
    }
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  // Track this browser as an active device session (also enforces admin
  // revocation — a revoked device is signed out on next load).
  useEffect(() => {
    void recordDeviceSession();
  }, []);
  return <Outlet />;
}
