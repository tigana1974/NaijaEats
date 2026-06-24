import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/naija/AppShell";
import { useMyRole } from "@/hooks/useMyRole";
import { toast } from "sonner";
import { Package, MapPin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/rider/available")({
  component: AvailableJobs,
});

function AvailableJobs() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: role, isLoading: roleLoading } = useMyRole();
  const { data, isLoading } = useQuery({
    queryKey: ["rider-available"],
    queryFn: async () => {
      const { data } = await supabase
        .from("deliveries")
        .select("*, orders(*, vendors(name,city,country))")
        .eq("status", "unassigned")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    refetchInterval: 10_000,
  });

  const claim = async (id: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    const { error } = await supabase
      .from("deliveries")
      .update({ rider_id: uid, status: "assigned" })
      .eq("id", id)
      .eq("status", "unassigned");
    if (error) return toast.error(error.message);
    toast.success("Job claimed");
    qc.invalidateQueries({ queryKey: ["rider-available"] });
    qc.invalidateQueries({ queryKey: ["rider-dashboard"] });
    navigate({ to: "/rider/dashboard" });
  };

  if (!roleLoading && role !== "rider") return <Navigate to="/" replace />;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold">Available jobs</h1>
        <p className="text-muted-foreground mt-1">Tap to claim and start delivering.</p>

        <div className="mt-6 space-y-3">
          {isLoading && <p className="text-muted-foreground">Loading…</p>}
          {!isLoading && data?.length === 0 && (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <Package className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">No jobs available right now. Check back soon.</p>
            </div>
          )}
          {data?.map((d: any) => {
            const symbol = d.currency === "GBP" ? "£" : "₦";
            const vendor = d.orders?.vendors;
            return (
              <div key={d.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-semibold">{vendor?.name ?? "Vendor"}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {vendor?.city ?? d.pickup_address ?? "Pickup"} → {d.dropoff_address || d.orders?.delivery_address || "Drop-off"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-xl font-semibold">{symbol}{Number(d.fee).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">payout</div>
                  </div>
                </div>
                <button
                  onClick={() => claim(d.id)}
                  className="mt-4 w-full rounded-lg bg-[var(--brand-clay)] text-[var(--brand-cream)] py-2.5 font-semibold"
                >
                  Claim job
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}