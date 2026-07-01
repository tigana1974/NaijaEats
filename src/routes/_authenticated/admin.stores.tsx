import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  UberPageTitle,
  UberKpi,
  UberTabs,
  UberFilterBar,
  UberTable,
  UberThead,
  UberTh,
  UberTr,
  UberTd,
  UberStatus,
  uberBtn,
} from "@/components/admin/AdminUI";
import { Plus, MoreHorizontal } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/stores")({
  component: AdminStores,
});

type TypeTab = "all" | "restaurant" | "chef" | "grocery" | "caterer";

function AdminStores() {
  const [tab, setTab] = useState<TypeTab>("all");
  const [search, setSearch] = useState("");

  const { data: vendors, isLoading } = useQuery({
    queryKey: ["admin-stores-full"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("id,name,type,status,city,country,commission_rate,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as any[];
    },
  });

  const list = vendors ?? [];

  const counts = useMemo(() => {
    const c: Record<TypeTab, number> = { all: list.length, restaurant: 0, chef: 0, grocery: 0, caterer: 0 };
    for (const v of list) {
      const t = (v.type || "") as TypeTab;
      if (t in c) c[t]++;
    }
    return c;
  }, [list]);

  const filtered = useMemo(() => {
    return list.filter((v: any) => {
      if (tab !== "all" && v.type !== tab) return false;
      if (search && !JSON.stringify(v).toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [list, tab, search]);

  const stats = useMemo(
    () => ({
      total: list.length,
      approved: list.filter((v: any) => v.status === "approved").length,
      pending: list.filter((v: any) => v.status === "pending").length,
      suspended: list.filter((v: any) => v.status === "suspended").length,
    }),
    [list],
  );

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Store"
          title="Store list"
          description="Restaurants, home chefs, grocery shops and caterers across United Kingdom and Nigeria."
          actions={
            <button type="button" className={uberBtn.primary}>
              <Plus className="h-3.5 w-3.5" /> Onboard vendor
            </button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UberKpi label="Total stores" value={isLoading ? "…" : stats.total.toLocaleString()} hint="Across all types" />
          <UberKpi label="Approved" value={isLoading ? "…" : stats.approved.toLocaleString()} hint="Live and receiving orders" />
          <UberKpi label="Pending" value={isLoading ? "…" : stats.pending.toLocaleString()} hint="Awaiting verification" />
          <UberKpi label="Suspended" value={isLoading ? "…" : stats.suspended.toLocaleString()} hint="Requires review" />
        </div>

        <div className="mt-8">
          <UberTabs<TypeTab>
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "all", label: "All", count: counts.all },
              { id: "restaurant", label: "Restaurants", count: counts.restaurant },
              { id: "chef", label: "Home chefs", count: counts.chef },
              { id: "grocery", label: "Grocery", count: counts.grocery },
              { id: "caterer", label: "Caterers", count: counts.caterer },
            ]}
          />

          <UberFilterBar
            search={search}
            onSearch={setSearch}
            filters={[{ label: "City" }, { label: "Country" }, { label: "Status" }, { label: "Rating" }]}
            onExport={() => {}}
          />

          <UberTable>
            <UberThead>
              <tr>
                <UberTh>Store</UberTh>
                <UberTh>Type</UberTh>
                <UberTh>Status</UberTh>
                <UberTh>Location</UberTh>
                <UberTh>Commission</UberTh>
                <UberTh>Onboarded</UberTh>
                <UberTh className="w-[1%]" />
              </tr>
            </UberThead>
            <tbody>
              {isLoading ? (
                <UberTr>
                  <UberTd className="py-8 text-center text-neutral-500">Loading stores…</UberTd>
                </UberTr>
              ) : filtered.length === 0 ? (
                <UberTr>
                  <UberTd className="py-8 text-center text-neutral-500">No stores match the current filter.</UberTd>
                </UberTr>
              ) : (
                filtered.map((v: any) => (
                  <UberTr key={v.id}>
                    <UberTd>
                      <div className="font-medium text-[oklch(0.18_0.006_260)]">{v.name}</div>
                      <div className="font-mono text-[11px] text-neutral-500">#{String(v.id).slice(0, 8)}</div>
                    </UberTd>
                    <UberTd className="capitalize text-neutral-700">{v.type || "—"}</UberTd>
                    <UberTd><UberStatus status={v.status} /></UberTd>
                    <UberTd className="text-neutral-600">
                      {[v.city, v.country].filter(Boolean).join(", ") || "—"}
                    </UberTd>
                    <UberTd className="text-neutral-700">
                      {v.commission_rate != null ? `${Number(v.commission_rate).toFixed(1)}%` : "—"}
                    </UberTd>
                    <UberTd className="text-neutral-500">
                      {v.created_at ? new Date(v.created_at).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" }) : "—"}
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
    </AdminShell>
  );
}
