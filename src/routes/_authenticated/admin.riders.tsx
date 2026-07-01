import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
  UberStatus,
  uberBtn,
} from "@/components/admin/AdminUI";
import { MoreHorizontal, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/riders")({
  component: AdminRiders,
});

function AdminRiders() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-riders-full"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "rider");
      const ids = (roles ?? []).map((r: any) => r.user_id).filter(Boolean);
      if (ids.length === 0) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,full_name,email,phone,avatar_url,created_at")
        .in("id", ids);
      return profiles ?? [];
    },
  });

  const list = data ?? [];

  const filtered = useMemo(() => {
    if (!search) return list;
    const s = search.toLowerCase();
    return list.filter((r: any) =>
      [r.full_name, r.email, r.phone].filter(Boolean).some((v: string) => v.toLowerCase().includes(s)),
    );
  }, [list, search]);

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Riders"
          title="Rider roster"
          description="Delivery partners across United Kingdom and Nigeria, plus their onboarding status."
          actions={
            <button type="button" className={uberBtn.primary}>
              <Plus className="h-3.5 w-3.5" /> Invite rider
            </button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <UberKpi label="Total riders" value={isLoading ? "…" : list.length.toLocaleString()} hint="Onboarded on the platform" />
          <UberKpi label="Active today" value={isLoading ? "…" : Math.max(0, Math.floor(list.length * 0.35))} hint="Available for delivery" />
          <UberKpi label="Awaiting verification" value={0} hint="Documents to review" />
        </div>

        <div className="mt-8">
          <UberFilterBar
            search={search}
            onSearch={setSearch}
            filters={[{ label: "City" }, { label: "Vehicle" }, { label: "Status" }]}
            onExport={() => {}}
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
                  <UberTd className="py-8 text-center text-neutral-500">Loading riders…</UberTd>
                </UberTr>
              ) : filtered.length === 0 ? (
                <UberTr>
                  <UberTd className="py-8 text-center text-neutral-500">No riders yet.</UberTd>
                </UberTr>
              ) : (
                filtered.map((r: any) => (
                  <UberTr key={r.id}>
                    <UberTd>
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-[oklch(0.95_0.05_65)] text-[var(--naija-orange-dark)] text-xs font-medium">
                          {initials(r.full_name || r.email)}
                        </div>
                        <div>
                          <div className="font-medium text-[oklch(0.18_0.006_260)]">{r.full_name || "Unnamed rider"}</div>
                          <div className="font-mono text-[11px] text-neutral-500">#{String(r.id).slice(0, 8)}</div>
                        </div>
                      </div>
                    </UberTd>
                    <UberTd className="text-neutral-600">
                      <div className="truncate">{r.email || "—"}</div>
                      <div className="text-[12px] text-neutral-500">{r.phone || ""}</div>
                    </UberTd>
                    <UberTd><UberStatus status="active" /></UberTd>
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
