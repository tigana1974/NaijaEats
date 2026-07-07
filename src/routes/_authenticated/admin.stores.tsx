import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  formatMoney,
} from "@/components/admin/AdminUI";
import { toast } from "sonner";
import { Star, Check, Ban, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/stores")({
  component: AdminStores,
});

// Matches the actual vendor_type enum in Supabase.
type TypeTab = "all" | "restaurant" | "home_chef" | "grocery" | "personal_chef";
const TYPE_LABEL: Record<string, string> = {
  restaurant: "Restaurant",
  home_chef: "Home chef",
  grocery: "Grocery",
  personal_chef: "Personal chef",
};

function AdminStores() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<TypeTab>("all");
  const [search, setSearch] = useState("");

  const { data: vendors, isLoading } = useQuery({
    queryKey: ["admin-stores-full"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("id,name,type,status,city,country,currency,rating,rating_count,is_featured,delivery_fee,prep_time_minutes,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as any[];
    },
  });

  const list = vendors ?? [];

  const setStatus = async (id: string, status: "approved" | "suspended" | "pending", name: string) => {
    const { error } = await supabase.from("vendors").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(
      status === "approved" ? `${name} approved` : status === "suspended" ? `${name} suspended` : `${name} set to pending`,
    );
    qc.invalidateQueries({ queryKey: ["admin-stores-full"] });
    qc.invalidateQueries({ queryKey: ["admin-dashboard-summary"] });
  };

  const counts = useMemo(() => {
    const c: Record<TypeTab, number> = { all: list.length, restaurant: 0, home_chef: 0, grocery: 0, personal_chef: 0 };
    for (const v of list) if (v.type in c) c[v.type as TypeTab]++;
    return c;
  }, [list]);

  const filtered = useMemo(() => {
    return list.filter((v: any) => {
      if (tab !== "all" && v.type !== tab) return false;
      if (search) {
        const hay = `${v.name} ${v.city} ${v.country} ${v.status} ${v.type}`.toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
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
          description="Restaurants, home chefs, grocery shops and personal chefs across United Kingdom and Nigeria."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UberKpi label="Total stores" value={isLoading ? "…" : stats.total.toLocaleString()} hint="Across all types" />
          <UberKpi label="Approved" value={isLoading ? "…" : stats.approved.toLocaleString()} hint="Live and receiving orders" />
          <UberKpi label="Pending" value={isLoading ? "…" : stats.pending.toLocaleString()} hint="Awaiting your approval" />
          <UberKpi label="Suspended" value={isLoading ? "…" : stats.suspended.toLocaleString()} hint="Requires review" />
        </div>

        <div className="mt-8">
          <UberTabs<TypeTab>
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "all", label: "All", count: counts.all },
              { id: "restaurant", label: "Restaurants", count: counts.restaurant },
              { id: "home_chef", label: "Home chefs", count: counts.home_chef },
              { id: "grocery", label: "Grocery", count: counts.grocery },
              { id: "personal_chef", label: "Personal chefs", count: counts.personal_chef },
            ]}
          />

          <UberFilterBar
            search={search}
            onSearch={setSearch}
            filters={[{ label: "City" }, { label: "Country" }, { label: "Status" }]}
            onExport={() => {}}
          />

          <UberTable>
            <UberThead>
              <tr>
                <UberTh>Store</UberTh>
                <UberTh>Type</UberTh>
                <UberTh>Status</UberTh>
                <UberTh>Location</UberTh>
                <UberTh>Rating</UberTh>
                <UberTh>Delivery fee</UberTh>
                <UberTh>Onboarded</UberTh>
                <UberTh>Actions</UberTh>
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
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[oklch(0.18_0.006_260)]">{v.name}</span>
                        {v.is_featured && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-[oklch(0.95_0.05_65)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--naija-orange-dark)]">
                            <Star className="h-2.5 w-2.5" /> Featured
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[11px] text-neutral-500">#{String(v.id).slice(0, 8)}</div>
                    </UberTd>
                    <UberTd className="text-neutral-700">{TYPE_LABEL[v.type] ?? v.type}</UberTd>
                    <UberTd><UberStatus status={v.status} /></UberTd>
                    <UberTd className="text-neutral-600">{[v.city, v.country].filter(Boolean).join(", ") || "—"}</UberTd>
                    <UberTd className="text-neutral-700">
                      {v.rating != null ? `${Number(v.rating).toFixed(1)} (${v.rating_count ?? 0})` : "—"}
                    </UberTd>
                    <UberTd className="text-neutral-700">
                      {v.delivery_fee != null ? formatMoney(Number(v.delivery_fee), v.currency || "GBP") : "—"}
                    </UberTd>
                    <UberTd className="text-neutral-500">
                      {v.created_at ? new Date(v.created_at).toLocaleDateString([], { day: "numeric", month: "short" }) : "—"}
                    </UberTd>
                    <UberTd>
                      <div className="flex items-center gap-1.5">
                        {v.status === "pending" && (
                          <ActionChip label="Approve" Icon={Check} tone="green" onClick={() => setStatus(v.id, "approved", v.name)} />
                        )}
                        {v.status === "approved" && (
                          <ActionChip label="Suspend" Icon={Ban} tone="red" onClick={() => setStatus(v.id, "suspended", v.name)} />
                        )}
                        {v.status === "suspended" && (
                          <ActionChip label="Reactivate" Icon={RotateCcw} tone="green" onClick={() => setStatus(v.id, "approved", v.name)} />
                        )}
                      </div>
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

function ActionChip({
  label,
  Icon,
  tone,
  onClick,
}: {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  tone: "green" | "red";
  onClick: () => void;
}) {
  const cls =
    tone === "green"
      ? "border-[var(--naija-green)] text-[var(--naija-green-dark)] hover:bg-[oklch(0.97_0.03_145)]"
      : "border-[oklch(0.6_0.16_15)] text-[oklch(0.42_0.16_15)] hover:bg-[oklch(0.97_0.02_15)]";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border bg-white px-2.5 py-1 text-[12px] font-medium ${cls}`}
    >
      <Icon className="h-3 w-3" /> {label}
    </button>
  );
}
