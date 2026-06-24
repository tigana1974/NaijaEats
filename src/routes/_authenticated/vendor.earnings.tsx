import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/naija/AppShell";
import { useMyRole } from "@/hooks/useMyRole";
import { toast } from "sonner";
import { Wallet, Banknote, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/vendor/earnings")({
  component: VendorEarnings,
});

const payoutStatusMeta: Record<string, { label: string; cls: string; Icon: typeof Clock }> = {
  requested: { label: "Requested", cls: "bg-amber-100 text-amber-900", Icon: Clock },
  processing: { label: "Processing", cls: "bg-blue-100 text-blue-900", Icon: Loader2 },
  paid: { label: "Paid", cls: "bg-green-100 text-green-900", Icon: CheckCircle2 },
  rejected: { label: "Rejected", cls: "bg-red-100 text-red-900", Icon: XCircle },
};

function VendorEarnings() {
  const { data: role, isLoading: roleLoading } = useMyRole();
  const qc = useQueryClient();
  const [requestingFor, setRequestingFor] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState("");
  const [methodInput, setMethodInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-earnings"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return null;
      const { data: vendor } = await supabase.from("vendors").select("id").eq("owner_id", uid).maybeSingle();
      if (!vendor) return { orders: [] as any[], totals: {} as Record<string, number> };
      // Only paid orders count toward payable revenue — an order that's
      // been delivered but never actually paid for isn't money you have.
      const { data: orders } = await supabase
        .from("orders")
        .select("id, total, currency, created_at")
        .eq("vendor_id", vendor.id)
        .eq("payment_status", "paid")
        .order("created_at", { ascending: false });
      const list = orders ?? [];
      const totals = list.reduce(
        (acc, o) => {
          const c = o.currency || "NGN";
          acc[c] = (acc[c] ?? 0) + Number(o.total || 0);
          return acc;
        },
        {} as Record<string, number>,
      );
      return { orders: list, totals };
    },
  });

  const { data: payouts } = useQuery({
    queryKey: ["my-payouts"],
    enabled: role === "vendor",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payouts")
        .select("*")
        .order("requested_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const requestedOrPaidByCurrency = (payouts ?? []).reduce(
    (acc, p: any) => {
      if (p.status === "rejected") return acc;
      acc[p.currency] = (acc[p.currency] ?? 0) + Number(p.amount);
      return acc;
    },
    {} as Record<string, number>,
  );

  const availableByCurrency: Record<string, number> = {};
  Object.entries(data?.totals ?? {}).forEach(([cur, total]) => {
    availableByCurrency[cur] = Math.max(0, Number(total) - (requestedOrPaidByCurrency[cur] ?? 0));
  });

  const submitPayoutRequest = async (currency: string) => {
    const amount = Number(amountInput);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amount > (availableByCurrency[currency] ?? 0)) {
      toast.error("Amount exceeds your available balance");
      return;
    }
    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");
      const { error } = await supabase.from("payouts").insert({
        user_id: uid,
        amount,
        currency,
        payout_method: methodInput.trim() || null,
      });
      if (error) throw error;
      toast.success("Payout requested");
      setRequestingFor(null);
      setAmountInput("");
      setMethodInput("");
      qc.invalidateQueries({ queryKey: ["my-payouts"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not request payout");
    } finally {
      setSubmitting(false);
    }
  };

  if (!roleLoading && role !== "vendor") return <Navigate to="/" replace />;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold">Earnings</h1>
        <p className="text-muted-foreground mt-1">Revenue from paid orders, and your payout requests.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {Object.entries(data?.totals ?? {}).length === 0 && !isLoading && (
            <div className="rounded-2xl border border-border bg-card p-6 text-center sm:col-span-2">
              <Wallet className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">No paid orders yet.</p>
            </div>
          )}
          {Object.entries(data?.totals ?? {}).map(([cur, amt]) => (
            <div key={cur} className="rounded-2xl border border-border bg-card p-5">
              <div className="text-sm text-muted-foreground">Lifetime paid revenue ({cur})</div>
              <div className="mt-1 font-display text-3xl font-semibold">
                {cur === "GBP" ? "£" : "₦"}{Number(amt).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Available to request: {cur === "GBP" ? "£" : "₦"}{(availableByCurrency[cur] ?? 0).toLocaleString()}
              </div>
              {requestingFor === cur ? (
                <div className="mt-3 space-y-2">
                  <input
                    type="number"
                    min={0}
                    max={availableByCurrency[cur] ?? 0}
                    placeholder={`Amount (max ${availableByCurrency[cur] ?? 0})`}
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <input
                    placeholder="Payout method (e.g. bank, account no.)"
                    value={methodInput}
                    onChange={(e) => setMethodInput(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => submitPayoutRequest(cur)}
                      disabled={submitting}
                      className="flex-1 rounded-lg bg-[var(--brand-clay)] text-[var(--brand-cream)] py-2 text-sm font-semibold disabled:opacity-50"
                    >
                      {submitting ? "Submitting…" : "Submit request"}
                    </button>
                    <button
                      onClick={() => setRequestingFor(null)}
                      className="rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setRequestingFor(cur);
                    setAmountInput(String(availableByCurrency[cur] ?? 0));
                  }}
                  disabled={(availableByCurrency[cur] ?? 0) <= 0}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-40"
                >
                  <Banknote className="h-3.5 w-3.5" /> Request payout
                </button>
              )}
            </div>
          ))}
        </div>

        {payouts && payouts.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-xl font-semibold">Payout history</h2>
            <div className="mt-3 rounded-2xl border border-border bg-card divide-y divide-border">
              {payouts.map((p: any) => {
                const meta = payoutStatusMeta[p.status] ?? payoutStatusMeta.requested;
                return (
                  <div key={p.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <div className="font-semibold">
                        {p.currency === "GBP" ? "£" : "₦"}{Number(p.amount).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Requested {new Date(p.requested_at).toLocaleDateString()}
                        {p.payout_method ? ` · ${p.payout_method}` : ""}
                      </div>
                      {p.admin_note && <div className="text-xs text-muted-foreground mt-0.5">Note: {p.admin_note}</div>}
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${meta.cls}`}>
                      <meta.Icon className="h-3 w-3" /> {meta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
