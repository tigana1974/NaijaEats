import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/naija/AppShell";
import { useMyRole } from "@/hooks/useMyRole";
import { toast } from "sonner";
import { Banknote, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/payouts")({
  component: AdminPayouts,
});

type Filter = "requested" | "processing" | "paid" | "rejected" | "all";

const statusMeta: Record<string, { label: string; cls: string; Icon: typeof Clock }> = {
  requested: { label: "Requested", cls: "bg-amber-100 text-amber-900", Icon: Clock },
  processing: { label: "Processing", cls: "bg-blue-100 text-blue-900", Icon: Loader2 },
  paid: { label: "Paid", cls: "bg-green-100 text-green-900", Icon: CheckCircle2 },
  rejected: { label: "Rejected", cls: "bg-red-100 text-red-900", Icon: XCircle },
};

function AdminPayouts() {
  const { data: role, isLoading: roleLoading } = useMyRole();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("requested");

  const { data: payouts, isLoading } = useQuery({
    queryKey: ["admin-payouts", filter],
    enabled: role === "admin",
    queryFn: async () => {
      let q = supabase.from("payouts").select("*").order("requested_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;

      const userIds = Array.from(new Set((data ?? []).map((p: any) => p.user_id)));
      const { data: profiles } = userIds.length
        ? await supabase.from("profiles").select("id,full_name,phone").in("id", userIds)
        : { data: [] as any[] };
      const { data: roles } = userIds.length
        ? await supabase.from("user_roles").select("user_id,role").in("user_id", userIds)
        : { data: [] as any[] };
      const profileById: Record<string, any> = {};
      (profiles ?? []).forEach((p: any) => (profileById[p.id] = p));
      const roleById: Record<string, string> = {};
      (roles ?? []).forEach((r: any) => {
        if (r.role === "vendor" || r.role === "rider") roleById[r.user_id] = r.role;
      });

      return (data ?? []).map((p: any) => ({
        ...p,
        full_name: profileById[p.user_id]?.full_name ?? null,
        requester_role: roleById[p.user_id] ?? "unknown",
      }));
    },
  });

  const updatePayout = async (
    id: string,
    status: "processing" | "paid" | "rejected",
    admin_note?: string,
  ) => {
    const { data: userData } = await supabase.auth.getUser();
    const patch: any = { status, admin_note: admin_note ?? null };
    if (status === "paid" || status === "rejected") {
      patch.processed_at = new Date().toISOString();
      patch.processed_by = userData.user?.id ?? null;
    }
    const { error } = await supabase.from("payouts").update(patch).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Payout ${status}`);
    qc.invalidateQueries({ queryKey: ["admin-payouts"] });
  };

  if (!roleLoading && role !== "admin") return <Navigate to="/" replace />;

  const filters: { key: Filter; label: string }[] = [
    { key: "requested", label: "Requested" },
    { key: "processing", label: "Processing" },
    { key: "paid", label: "Paid" },
    { key: "rejected", label: "Rejected" },
    { key: "all", label: "All" },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-2">Payouts</h1>
        <p className="text-muted-foreground mb-6">Review and settle vendor and rider payout requests.</p>

        <div className="flex gap-2 mb-6 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-1.5 text-sm border transition ${
                filter === f.key
                  ? "bg-[var(--brand-clay)] text-[var(--brand-cream)] border-[var(--brand-clay)]"
                  : "bg-card border-border hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : !payouts || payouts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No payout requests in this view.
          </div>
        ) : (
          <div className="grid gap-3">
            {payouts.map((p: any) => {
              const meta = statusMeta[p.status] ?? statusMeta.requested;
              return (
                <div key={p.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-lg">
                          {p.currency === "GBP" ? "£" : "₦"}{Number(p.amount).toLocaleString()}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${meta.cls}`}>
                          <meta.Icon className="h-3 w-3" /> {meta.label}
                        </span>
                        <span className="text-xs rounded-full px-2 py-0.5 bg-muted capitalize">
                          {p.requester_role}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {p.full_name || "Unnamed user"} · <span className="font-mono text-xs">{p.user_id}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Requested {new Date(p.requested_at).toLocaleString()}
                        {p.payout_method ? ` · ${p.payout_method}` : ""}
                      </p>
                      {p.admin_note && <p className="text-xs text-muted-foreground mt-1">Note: {p.admin_note}</p>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {p.status === "requested" && (
                        <button
                          onClick={() => updatePayout(p.id, "processing")}
                          className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                        >
                          Mark processing
                        </button>
                      )}
                      {(p.status === "requested" || p.status === "processing") && (
                        <>
                          <button
                            onClick={() => updatePayout(p.id, "paid")}
                            className="flex items-center gap-1 rounded-full bg-[var(--brand-clay)] text-[var(--brand-cream)] px-3 py-1.5 text-xs font-medium hover:opacity-90"
                          >
                            <Banknote className="h-3.5 w-3.5" /> Mark paid
                          </button>
                          <button
                            onClick={() => {
                              const reason = window.prompt("Reason for rejecting this payout?") ?? undefined;
                              updatePayout(p.id, "rejected", reason);
                            }}
                            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
