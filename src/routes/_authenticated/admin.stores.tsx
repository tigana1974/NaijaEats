import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  PageHeader,
  PageBody,
  KpiCard,
  Card,
  FilterBar,
  StatusBadge,
  TableWrap,
  Thead,
  Th,
  Tr,
  Td,
  EmptyState,
  btn,
} from "@/components/admin/AdminUI";
import { Store, CheckCircle2, PauseCircle, Clock, Plus, MoreHorizontal } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/stores")({
  component: AdminStores,
});

const TABS = [
  { key: "all", label: "All stores" },
  { key: "restaurant", label: "Restaurants" },
  { key: "chef", label: "Home chefs" },
  { key: "grocery", label: "Grocery" },
  { key: "caterer", label: "Caterers" },
];

function AdminStores() {
  const [tab, setTab] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const { data: vendors, isLoading } = useQuery({
    queryKey: ["admin-stores"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("id,name,type,status,city,country,commission_rate,created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const list = vendors ?? [];
    return list.filter((v: any) => {
      if (tab !== "all" && v.type !== tab) return false;
      if (search && !JSON.stringify(v).toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [vendors, tab, search]);

  const stats = useMemo(() => {
    const list = vendors ?? [];
    return {
      total: list.length,
      approved: list.filter((v: any) => v.status === "approved").length,
      pending: list.filter((v: any) => v.status === "pending").length,
      suspended: list.filter((v: any) => v.status === "suspended").length,
    };
  }, [vendors]);

  return (
    <AdminShell>
      <PageHeader
        title="Stores"
        description="Manage restaurants, home chefs, grocery shops and caterers across the platform."
        actions={
          <button className={btn.primary}>
            <Plus className="h-4 w-4" /> Onboard store
          </button>
        }
      />
      <PageBody>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Total stores" value={stats.total} Icon={Store} accent="green" />
          <KpiCard label="Approved" value={stats.approved} Icon={CheckCircle2} accent="green" />
          <KpiCard label="Pending" value={stats.pending} Icon={Clock} accent="orange" />
          <KpiCard label="Suspended" value={stats.suspended} Icon={PauseCircle} accent="ink" />
        </div>

        <div className="mt-6">
          <Card>
            <div className="flex flex-wrap items-center gap-1 border-b border-border px-4 py-2">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    tab === t.key
                      ? "bg-[var(--naija-green)]/10 text-[var(--naija-green)] font-medium"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="p-4">
              <FilterBar
                onSearch={setSearch}
                filters={[{ label: "Country" }, { label: "City" }, { label: "Verification" }]}
              />

              {isLoading ? (
                <div className="p-6 text-sm text-muted-foreground">Loading stores…</div>
              ) : filtered.length === 0 ? (
                <EmptyState
                  title="No stores yet"
                  description="Approved and pending stores will appear here as vendors sign up."
                  action={<button className={btn.primary}>Onboard first store</button>}
                />
              ) : (
                <TableWrap>
                  <Thead>
                    <tr>
                      <Th>Store</Th>
                      <Th>Type</Th>
                      <Th>Status</Th>
                      <Th>Location</Th>
                      <Th>Commission</Th>
                      <Th>Onboarded</Th>
                      <Th className="text-right">Actions</Th>
                    </tr>
                  </Thead>
                  <tbody>
                    {filtered.map((v: any) => (
                      <Tr key={v.id}>
                        <Td className="font-medium">{v.name || "Untitled store"}</Td>
                        <Td className="capitalize text-muted-foreground">{v.type || "—"}</Td>
                        <Td>
                          <StatusBadge status={v.status || "pending"} />
                        </Td>
                        <Td className="text-muted-foreground">
                          {[v.city, v.country].filter(Boolean).join(", ") || "—"}
                        </Td>
                        <Td>{v.commission_rate ? `${v.commission_rate}%` : "—"}</Td>
                        <Td className="text-muted-foreground">
                          {v.created_at ? new Date(v.created_at).toLocaleDateString() : "—"}
                        </Td>
                        <Td className="text-right">
                          <button className="rounded-md p-1.5 hover:bg-muted">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </TableWrap>
              )}
            </div>
          </Card>
        </div>
      </PageBody>
    </AdminShell>
  );
}
