import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  UberPageTitle,
  UberKpi,
  UberFilterBar,
  UberTable,
  UberThead,
  UberTh,
  UberTr,
  UberTd,
  uberBtn,
} from "@/components/admin/AdminUI";
import { MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import { REQUIRED_RIDER_DOCS } from "@/hooks/useRiderStatus";
import { exportCsv } from "@/lib/csv";
import { useAdminRegion } from "@/hooks/useAdminScope";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/riders")({
  component: AdminRiders,
});

function AdminRiders() {
  const { region, country, countryLabel } = useAdminRegion();
  const [search, setSearch] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const inviteMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("user_invites" as any).insert({
        email: String(formData.email).trim().toLowerCase(),
        role: "rider",
        invited_by: u.user?.id,
      });
      if (error) throw error;
      return String(formData.email).trim().toLowerCase();
    },
    onSuccess: (email) => {
      const signupUrl = `${window.location.origin}/auth`;
      navigator.clipboard?.writeText(signupUrl).catch(() => {});
      toast.success(
        `Invite recorded — when ${email} signs up they join as a rider. Signup link copied to clipboard.`,
        { duration: 6000 },
      );
      setIsInviteOpen(false);
    },
    onError: (err: any) => {
      toast.error(`Failed to invite rider: ${err.message}`);
    }
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-riders-full", region],
    staleTime: 60_000,
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "rider");
      const ids = (roles ?? []).map((r: any) => r.user_id).filter(Boolean);
      if (ids.length === 0) return { profiles: [], docs: [], activeRiderIds: new Set<string>() };
      let profilesQ = supabase
        .from("profiles")
        .select("id,full_name,phone,avatar_url,created_at,country")
        .in("id", ids);
      if (country) profilesQ = profilesQ.eq("country", country);
      const [{ data: profiles }, { data: docs }, { data: activeDeliveries }] = await Promise.all([
        profilesQ,
        supabase
          .from("rider_documents")
          .select("rider_id, doc_type, status")
          .in("rider_id", ids),
        supabase
          .from("deliveries")
          .select("rider_id")
          .in("rider_id", ids)
          .or(`status.in.(assigned,picked_up),delivered_at.gte.${startOfTodayIso()}`),
      ]);
      return {
        profiles: profiles ?? [],
        docs: docs ?? [],
        activeRiderIds: new Set((activeDeliveries ?? []).map((d: any) => d.rider_id).filter(Boolean)),
      };
    },
  });

  const list = data?.profiles ?? [];
  const verificationByRider = useMemo(() => {
    const map = new Map<string, "verified" | "pending" | "incomplete">();
    for (const r of list) {
      const riderDocs = (data?.docs ?? []).filter((d: any) => d.rider_id === r.id);
      let missing = 0;
      let pending = 0;
      for (const req of REQUIRED_RIDER_DOCS) {
        const uploads = riderDocs.filter((d: any) => d.doc_type === req.key);
        if (uploads.some((d: any) => d.status === "verified")) continue;
        if (uploads.some((d: any) => d.status === "pending")) pending += 1;
        else missing += 1;
      }
      map.set(r.id, missing > 0 ? "incomplete" : pending > 0 ? "pending" : "verified");
    }
    return map;
  }, [list, data?.docs]);

  const awaitingCount = [...verificationByRider.values()].filter((v) => v === "pending").length;
  const activeCount = list.filter((r: any) => data?.activeRiderIds?.has(r.id)).length;

  const [verificationFilter, setVerificationFilter] = useState("");

  const filtered = useMemo(() => {
    return list.filter((r: any) => {
      if (verificationFilter && verificationByRider.get(r.id) !== verificationFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (![r.full_name, r.phone].filter(Boolean).some((v: string) => v.toLowerCase().includes(s))) return false;
      }
      return true;
    });
  }, [list, search, verificationFilter, verificationByRider]);

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Riders"
          title={`Rider roster — ${countryLabel}`}
          description={country ? `Delivery partners in ${countryLabel}, plus their onboarding status.` : "Delivery partners across United Kingdom and Nigeria, plus their onboarding status."}
          actions={
            <button type="button" className={uberBtn.primary} onClick={() => setIsInviteOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Invite rider
            </button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <UberKpi label="Total riders" value={isLoading ? "…" : list.length.toLocaleString()} hint="Onboarded on the platform" />
          <UberKpi label="Active today" value={isLoading ? "…" : activeCount.toLocaleString()} hint="On a delivery today" />
          <UberKpi label="Awaiting verification" value={isLoading ? "…" : awaitingCount.toLocaleString()} hint="Documents to review" />
        </div>

        <div className="mt-8">
          <UberFilterBar
            search={search}
            onSearch={setSearch}
            filters={[
              {
                label: "Verification",
                value: verificationFilter,
                onChange: setVerificationFilter,
                options: [
                  { value: "verified", label: "Verified" },
                  { value: "pending", label: "Pending review" },
                  { value: "incomplete", label: "Incomplete" },
                ],
              },
            ]}
            onExport={() =>
              exportCsv(`riders_${new Date().toISOString().slice(0, 10)}.csv`, filtered, {
                ID: "id",
                Name: (r: any) => r.full_name ?? "",
                Phone: (r: any) => r.phone ?? "",
                Country: (r: any) => r.country ?? "",
                Verification: (r: any) => verificationByRider.get(r.id) ?? "",
                Joined: (r: any) => r.created_at ?? "",
              })
            }
          />

          <UberTable>
            <UberThead>
              <tr>
                <UberTh>Rider</UberTh>
                <UberTh>Contact</UberTh>
                <UberTh>Status</UberTh>
                <UberTh>Joined</UberTh>
                <UberTh className="w-[1%]" />
              </tr>
            </UberThead>
            <tbody>
              {isLoading ? (
                <UberTr>
                  <UberTd colSpan={10} className="py-8 text-center text-neutral-500">Loading riders…</UberTd>
                </UberTr>
              ) : filtered.length === 0 ? (
                <UberTr>
                  <UberTd colSpan={10} className="py-8 text-center text-neutral-500">No riders yet.</UberTd>
                </UberTr>
              ) : (
                filtered.map((r: any) => (
                  <UberTr key={r.id}>
                    <UberTd>
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-[oklch(0.95_0.05_65)] text-[var(--naija-orange-dark)] text-xs font-medium">
                          {initials(r.full_name)}
                        </div>
                        <div>
                          <div className="font-medium text-[oklch(0.18_0.006_260)]">{r.full_name || "Unnamed rider"}</div>
                          <div className="font-mono text-[11px] text-neutral-500">#{String(r.id).slice(0, 8)}</div>
                        </div>
                      </div>
                    </UberTd>
                    <UberTd className="text-neutral-600">
                      <div className="truncate">{r.phone || "—"}</div>
                    </UberTd>
                    <UberTd><RiderVerificationChip status={verificationByRider.get(r.id) ?? "incomplete"} /></UberTd>
                    <UberTd className="text-neutral-500">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </UberTd>
                    <UberTd>
                      <button className="rounded-full p-1.5 hover:bg-[oklch(0.965_0.003_260)]">
                        <MoreHorizontal className="h-4 w-4 text-neutral-500" />
                      </button>
                    </UberTd>
                  </UberTr>
                ))
              )}
            </tbody>
          </UberTable>
        </div>
      </div>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Invite Rider</DialogTitle>
            <DialogDescription>
              Send an invitation to a new delivery partner to download the rider app.
            </DialogDescription>
          </DialogHeader>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              inviteMutation.mutate(Object.fromEntries(fd));
            }}
            className="grid gap-4 py-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">First Name</label>
                <input required name="first_name" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="e.g. John" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Last Name</label>
                <input required name="last_name" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="e.g. Doe" />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Email address</label>
              <input required type="email" name="email" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="john@example.com" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Phone</label>
              <input required name="phone" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="+234..." />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Vehicle Type</label>
              <select name="vehicle" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="bike">Bicycle</option>
                <option value="motorbike">Motorbike / Scooter</option>
                <option value="car">Car</option>
                <option value="van">Van</option>
              </select>
            </div>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <button type="button" className={uberBtn.secondary}>Cancel</button>
              </DialogClose>
              <button type="submit" disabled={inviteMutation.isPending} className={uberBtn.primary}>
                {inviteMutation.isPending ? "Sending..." : "Send Invite"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function RiderVerificationChip({ status }: { status: "verified" | "pending" | "incomplete" }) {
  const meta = {
    verified: { label: "Verified", cls: "bg-[oklch(0.95_0.05_145)] text-[var(--naija-green-dark)]" },
    pending: { label: "Pending review", cls: "bg-[oklch(0.95_0.05_65)] text-[var(--naija-orange-dark)]" },
    incomplete: { label: "Docs incomplete", cls: "bg-[oklch(0.95_0.005_260)] text-[oklch(0.32_0.006_260)]" },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-medium ${meta.cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-90" />
      {meta.label}
    </span>
  );
}

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}
