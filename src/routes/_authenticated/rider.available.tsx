import { createFileRoute, Link, useNavigate, Navigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/naija/AppShell";
import { useMyRole } from "@/hooks/useMyRole";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useRiderOnline, useRiderVerification } from "@/hooks/useRiderStatus";
import { RiderVerificationBanner } from "@/components/naija/RiderVerificationBanner";
import { toast } from "sonner";
import { Package, MapPin, Store, Moon, Bike } from "lucide-react";

export const Route = createFileRoute("/_authenticated/rider/available")({
  component: AvailableJobs,
});

function AvailableJobs() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: role, isLoading: roleLoading } = useMyRole();
  const { data: profile } = useMyProfile();
  const [online, setOnline] = useRiderOnline();
  const verification = useRiderVerification(role === "rider");
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["rider-available"],
    enabled: online,
    queryFn: async () => {
      const { data } = await supabase
        .from("deliveries")
        .select("*, orders(*, vendors(name, city, country, address_line))")
        .eq("status", "unassigned")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    // Backstop in case realtime isn't available; realtime below is the fast path.
    refetchInterval: 15_000,
  });

  // One active delivery at a time — a rider mid-run shouldn't stack jobs.
  const { data: activeDelivery } = useQuery({
    queryKey: ["rider-active-check"],
    enabled: role === "rider",
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return null;
      const { data } = await supabase
        .from("deliveries")
        .select("id, status")
        .eq("rider_id", uid)
        .in("status", ["assigned", "picked_up"])
        .limit(1);
      return (data ?? [])[0] ?? null;
    },
  });

  // Live job feed: refresh the board the moment a delivery is posted or
  // claimed by someone else, instead of waiting for the next poll.
  useEffect(() => {
    const channel = supabase
      .channel("rider-job-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries" }, (payload) => {
        qc.invalidateQueries({ queryKey: ["rider-available"] });
        qc.invalidateQueries({ queryKey: ["rider-active-check"] });
        if (payload.eventType === "INSERT" && (payload.new as any)?.status === "unassigned" && online) {
          toast.info("New delivery job just dropped");
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, online]);

  // Only show jobs in the rider's own market.
  const riderCountry = profile?.country;
  const jobs = (data ?? []).filter((d: any) => {
    const vendorCountry = d.orders?.vendors?.country;
    return !riderCountry || !vendorCountry || vendorCountry === riderCountry;
  });

  const canClaim = online && verification.status === "verified" && !activeDelivery;

  const claim = async (id: string) => {
    if (!online) return toast.error("Go online first to claim jobs.");
    if (verification.status !== "verified") return toast.error("Your documents must be verified before you can claim jobs.");
    if (activeDelivery) return toast.error("Finish your current delivery before claiming another.");
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    setClaimingId(id);
    try {
      // `.eq("status","unassigned")` + `.select()` makes the claim atomic:
      // zero rows back means another rider beat us to it.
      const { data: claimed, error } = await supabase
        .from("deliveries")
        .update({ rider_id: uid, status: "assigned" })
        .eq("id", id)
        .eq("status", "unassigned")
        .select("id");
      if (error) return toast.error(error.message);
      if (!claimed || claimed.length === 0) {
        toast.error("Too slow — another rider just claimed this job.");
        qc.invalidateQueries({ queryKey: ["rider-available"] });
        return;
      }
      toast.success("Job claimed — head to the pickup point");
      qc.invalidateQueries({ queryKey: ["rider-available"] });
      qc.invalidateQueries({ queryKey: ["rider-dashboard"] });
      qc.invalidateQueries({ queryKey: ["rider-active-check"] });
      navigate({ to: "/rider/dashboard" });
    } finally {
      setClaimingId(null);
    }
  };

  if (!roleLoading && role !== "rider") return <Navigate to="/" replace />;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold">Available jobs</h1>
        <p className="text-muted-foreground mt-1">Tap to claim and start delivering.</p>

        <div className="mt-6 space-y-3">
          <RiderVerificationBanner verification={verification} />

          {activeDelivery && (
            <div className="rounded-2xl border border-[var(--brand-clay)]/30 bg-[oklch(0.97_0.02_25)] p-4 flex items-center gap-3">
              <Bike className="h-5 w-5 text-[var(--brand-clay)] shrink-0" />
              <div className="text-sm flex-1 text-zinc-900">
                <span className="font-semibold">You have a delivery in progress.</span>{" "}
                Finish it before claiming another job.
              </div>
              <Link
                to="/rider/dashboard"
                className="shrink-0 rounded-full bg-[var(--brand-clay)] text-[var(--brand-cream)] px-4 py-1.5 text-xs font-semibold"
              >
                Go to delivery
              </Link>
            </div>
          )}

          {!online ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <Moon className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="mt-2 font-semibold">You're offline</p>
              <p className="text-sm text-muted-foreground mt-1">Go online to see and claim delivery jobs.</p>
              <button
                onClick={() => setOnline(true)}
                className="mt-4 rounded-full bg-green-600 text-white px-5 py-2.5 text-sm font-semibold shadow-lg shadow-green-600/30"
              >
                Go online
              </button>
            </div>
          ) : (
            <>
              {isLoading && <p className="text-muted-foreground">Loading…</p>}
              {!isLoading && jobs.length === 0 && (
                <div className="rounded-2xl border border-border bg-card p-8 text-center">
                  <Package className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">
                    No jobs in {riderCountry === "UK" ? "the UK" : riderCountry === "NG" ? "Nigeria" : "your area"} right now.
                    New jobs appear here the moment they're posted.
                  </p>
                </div>
              )}
              {jobs.map((d: any) => {
                const symbol = d.currency === "GBP" ? "£" : "₦";
                const vendor = d.orders?.vendors;
                const pickup = d.pickup_address || [vendor?.address_line, vendor?.city].filter(Boolean).join(", ");
                const dropoff = d.dropoff_address || d.orders?.delivery_address;
                return (
                  <div key={d.id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="font-semibold flex items-center gap-1.5">
                          <Store className="h-4 w-4 text-muted-foreground shrink-0" />
                          {vendor?.name ?? "Vendor"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1.5 space-y-1">
                          <div className="flex items-start gap-1">
                            <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-[var(--brand-clay)]" />
                            <span className="line-clamp-1">{pickup || "Pickup"}</span>
                          </div>
                          <div className="flex items-start gap-1">
                            <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                            <span className="line-clamp-1">{dropoff || "Drop-off"}</span>
                          </div>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1.5">Posted {timeAgo(d.created_at)}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-display text-xl font-semibold">{symbol}{Number(d.fee).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">payout</div>
                      </div>
                    </div>
                    <button
                      onClick={() => claim(d.id)}
                      disabled={!canClaim || claimingId === d.id}
                      className="mt-4 w-full rounded-lg bg-[var(--brand-clay)] text-[var(--brand-cream)] py-2.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {claimingId === d.id
                        ? "Claiming…"
                        : activeDelivery
                          ? "Finish current delivery first"
                          : verification.status !== "verified"
                            ? "Verification required"
                            : "Claim job"}
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function timeAgo(iso: string) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString();
}
