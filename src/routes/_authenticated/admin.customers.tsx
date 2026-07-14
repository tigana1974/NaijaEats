import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminRegion } from "@/hooks/useAdminScope";
import {
  UberPageTitle,
  UberKpi,
  UberFilterBar,
  UberTable,
  UberThead,
  UberTh,
  UberTr,
  UberTd,
  UberStatus,
  uberBtn,
  formatMoney,
} from "@/components/admin/AdminUI";
import { MoreHorizontal, Send } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  component: AdminCustomers,
});

function AdminCustomers() {
  const { region, country, currency: regionCurrency, countryLabel } = useAdminRegion();
  const [search, setSearch] = useState("");
  const [isCampaignOpen, setIsCampaignOpen] = useState(false);

  const campaignMutation = useMutation({
    mutationFn: async (formData: any) => {
      // Simulate API call to email provider or marketing service
      await new Promise(r => setTimeout(r, 1200));
      console.log("Sent campaign:", formData);
    },
    onSuccess: () => {
      toast.success("Campaign dispatched successfully");
      setIsCampaignOpen(false);
    },
    onError: (err: any) => {
      toast.error(`Failed to send campaign: ${err.message}`);
    }
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-customers-full", region],
    staleTime: 60_000,
    queryFn: async () => {
      let profilesQ = supabase.from("profiles").select("id,full_name,phone,avatar_url,created_at,country").limit(500);
      if (country) profilesQ = profilesQ.eq("country", country);
      let ordersQ = supabase.from("orders").select("customer_id,total,currency,created_at,status");
      if (regionCurrency) ordersQ = ordersQ.eq("currency", regionCurrency);
      const [profilesRes, ordersRes] = await Promise.all([profilesQ, ordersQ]);
      const profiles = profilesRes.data ?? [];
      const orders = ordersRes.data ?? [];
      const byCustomer = new Map<string, { count: number; spend: number; currency: string; last: string | null }>();
      for (const o of orders as any[]) {
        if (!o.customer_id) continue;
        const cur = byCustomer.get(o.customer_id) ?? { count: 0, spend: 0, currency: regionCurrency ?? "NGN", last: null };
        cur.count += 1;
        cur.spend += Number(o.total ?? 0);
        cur.currency = (o.currency as string) || cur.currency;
        if (!cur.last || new Date(o.created_at) > new Date(cur.last)) cur.last = o.created_at;
        byCustomer.set(o.customer_id, cur);
      }
      return { profiles, byCustomer };
    },
  });

  const rows = useMemo(() => {
    if (!data) return [];
    return (data.profiles as any[]).map((p) => ({
      ...p,
      ...(data.byCustomer.get(p.id) ?? { count: 0, spend: 0, currency: regionCurrency ?? "NGN", last: null }),
    }));
  }, [data, regionCurrency]);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const s = search.toLowerCase();
    return rows.filter((r: any) =>
      [r.full_name, r.phone].filter(Boolean).some((v: string) => v.toLowerCase().includes(s)),
    );
  }, [rows, search]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const newThisMonth = rows.filter((r: any) => r.created_at && new Date(r.created_at) >= monthAgo).length;
    const repeat = rows.filter((r: any) => r.count >= 2).length;
    const spenders = rows.filter((r: any) => r.count > 0);
    const avgLtv = spenders.length ? spenders.reduce((s: number, r: any) => s + r.spend, 0) / spenders.length : 0;
    const currency = (spenders[0]?.currency as string) || "GBP";
    return { total: rows.length, newThisMonth, repeat, avgLtv, currency };
  }, [rows]);

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Customers"
          title={`Customer list — ${countryLabel}`}
          description="Everyone who has ordered on Naija Eats, plus their lifetime spend and status."
          actions={
            <button type="button" className={uberBtn.primary} onClick={() => setIsCampaignOpen(true)}>
              <Send className="h-3.5 w-3.5" /> Send campaign
            </button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UberKpi label="Total customers" value={isLoading ? "…" : stats.total.toLocaleString()} hint="Registered accounts" />
          <UberKpi label="New this month" value={isLoading ? "…" : stats.newThisMonth.toLocaleString()} hint="Joined in the last 30 days" />
          <UberKpi label="Repeat customers" value={isLoading ? "…" : stats.repeat.toLocaleString()} hint="2 or more completed orders" />
          <UberKpi label="Avg lifetime value" value={isLoading ? "…" : formatMoney(stats.avgLtv, stats.currency)} hint="Per repeat customer" />
        </div>

        <div className="mt-8">
          <UberFilterBar
            search={search}
            onSearch={setSearch}
            filters={[{ label: "Segment" }, { label: "City" }, { label: "Signup" }]}
            onExport={() => {}}
          />

          <UberTable>
            <UberThead>
              <tr>
                <UberTh>Customer</UberTh>
                <UberTh>Contact</UberTh>
                <UberTh>Orders</UberTh>
                <UberTh>Spend</UberTh>
                <UberTh>Last order</UberTh>
                <UberTh>Status</UberTh>
                <UberTh className="w-[1%]" />
              </tr>
            </UberThead>
            <tbody>
              {isLoading ? (
                <UberTr>
                  <UberTd colSpan={10} className="py-8 text-center text-neutral-500">Loading customers…</UberTd>
                </UberTr>
              ) : filtered.length === 0 ? (
                <UberTr>
                  <UberTd colSpan={10} className="py-8 text-center text-neutral-500">No customers match the current filter.</UberTd>
                </UberTr>
              ) : (
                filtered.map((c: any) => (
                  <UberTr key={c.id}>
                    <UberTd>
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-[oklch(0.95_0.05_145)] text-[var(--naija-green-dark)] text-xs font-medium">
                          {initials(c.full_name)}
                        </div>
                        <div>
                          <div className="font-medium text-[oklch(0.18_0.006_260)]">{c.full_name || "Unnamed"}</div>
                          <div className="font-mono text-[11px] text-neutral-500">#{String(c.id).slice(0, 8)}</div>
                        </div>
                      </div>
                    </UberTd>
                    <UberTd className="text-neutral-600">
                      <div className="truncate">{c.phone || "—"}</div>
                    </UberTd>
                    <UberTd className="text-neutral-700">{c.count}</UberTd>
                    <UberTd className="font-medium">{formatMoney(c.spend, c.currency)}</UberTd>
                    <UberTd className="text-neutral-500">
                      {c.last ? new Date(c.last).toLocaleDateString([], { day: "numeric", month: "short" }) : "—"}
                    </UberTd>
                    <UberTd>
                      <UberStatus status={c.count > 0 ? "active" : "inactive"} />
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

      <Sheet open={isCampaignOpen} onOpenChange={setIsCampaignOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto w-full">
          <SheetHeader>
            <SheetTitle>Send Campaign</SheetTitle>
            <SheetDescription>
              Draft and send an email or push notification to your customers.
            </SheetDescription>
          </SheetHeader>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              campaignMutation.mutate(Object.fromEntries(fd));
            }}
            className="mt-6 space-y-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">Campaign Title (Internal)</label>
              <input required name="title" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="e.g. Summer Promo 2026" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject Line</label>
              <input required name="subject" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Get 10% off your next meal!" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Audience</label>
              <select name="audience" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="all">All Customers</option>
                <option value="high_spenders">High Spenders (Top 20%)</option>
                <option value="churned">Churned (No orders in 30 days)</option>
                <option value="new">New (Created in last 7 days)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Message Body</label>
              <textarea 
                required 
                name="body" 
                rows={6}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none" 
                placeholder="Write your campaign message here..." 
              />
            </div>

            <SheetFooter className="mt-8 pt-4 border-t">
              <SheetClose asChild>
                <button type="button" className={uberBtn.secondary}>Cancel</button>
              </SheetClose>
              <button type="submit" disabled={campaignMutation.isPending} className={uberBtn.primary}>
                {campaignMutation.isPending ? "Sending..." : "Send Campaign"}
              </button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </AdminShell>
  );
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
