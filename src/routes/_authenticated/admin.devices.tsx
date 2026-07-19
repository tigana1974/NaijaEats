// @ts-nocheck
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  UberPageTitle,
  UberKpi,
  UberTable,
  UberThead,
  UberTh,
  UberTr,
  UberTd,
  UberStatus,
} from "@/components/admin/AdminUI";
import { Smartphone, Tablet, Laptop, ShieldAlert, PowerOff, RotateCcw, Search } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/devices")({
  component: AdminDevices,
});

function AdminDevices() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: devices, isLoading } = useQuery({
    queryKey: ["admin-devices"],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_devices")
        .select("*")
        .order("last_seen_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      const rows = data ?? [];

      const userIds = [...new Set(rows.map((d: any) => d.user_id))];
      let names = new Map<string, string>();
      let roles = new Map<string, string>();
      if (userIds.length > 0) {
        const [{ data: profiles }, { data: userRoles }] = await Promise.all([
          supabase.from("profiles").select("id, full_name").in("id", userIds),
          supabase.from("user_roles").select("user_id, role").in("user_id", userIds),
        ]);
        names = new Map((profiles ?? []).map((p: any) => [p.id, p.full_name || "Unnamed"]));
        for (const r of userRoles ?? []) {
          const cur = roles.get(r.user_id);
          if (!cur || cur === "customer") roles.set(r.user_id, r.role);
        }
      }
      return rows.map((d: any) => ({
        ...d,
        userName: names.get(d.user_id) ?? "Unknown",
        userRole: roles.get(d.user_id) ?? "customer",
      }));
    },
  });

  const setRevoked = useMutation({
    mutationFn: async ({ id, revoked }: { id: string; revoked: boolean }) => {
      const { error } = await supabase
        .from("user_devices")
        .update({ revoked, revoked_at: revoked ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      toast.success(
        vars.revoked
          ? "Device revoked — it is signed out the next time it opens the app"
          : "Device restored",
      );
      qc.invalidateQueries({ queryKey: ["admin-devices"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to update device"),
  });

  const list = devices ?? [];
  const filtered = list.filter(
    (d: any) =>
      d.userName.toLowerCase().includes(search.toLowerCase()) ||
      (d.device_label ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const dayAgo = Date.now() - 86_400_000;
  const kpis = {
    active: list.filter((d: any) => !d.revoked && new Date(d.last_seen_at).getTime() > dayAgo).length,
    tablets: list.filter((d: any) => d.device_type === "tablet").length,
    desktops: list.filter((d: any) => d.device_type === "desktop").length,
    revoked: list.filter((d: any) => d.revoked).length,
  };

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Security & IT"
          title="Active Devices"
          description="Devices that have signed in to NaijaEats. Revoking a device signs it out on its next app load."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-8">
          <UberKpi label="Active (24h)" value={isLoading ? "…" : kpis.active} Icon={Smartphone} accent="green" />
          <UberKpi label="Tablets" value={isLoading ? "…" : kpis.tablets} Icon={Tablet} accent="blue" />
          <UberKpi label="Desktops" value={isLoading ? "…" : kpis.desktops} Icon={Laptop} accent="ink" />
          <UberKpi label="Revoked" value={isLoading ? "…" : kpis.revoked} Icon={ShieldAlert} accent="red" />
        </div>

        <div className="mt-8">
          <div className="rounded-xl border border-border bg-card p-0 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border p-5 bg-neutral-50/50 gap-4">
              <h3 className="font-semibold text-lg">Device Sessions</h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search user or device..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-core"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <UberTable>
              <UberThead>
                <tr>
                  <UberTh>User / Owner</UberTh>
                  <UberTh>Device</UberTh>
                  <UberTh>App</UberTh>
                  <UberTh>Last Active</UberTh>
                  <UberTh>Status</UberTh>
                  <UberTh></UberTh>
                </tr>
              </UberThead>
              <tbody>
                {isLoading ? (
                  <UberTr><UberTd colSpan={6} className="text-center py-8">Loading devices...</UberTd></UberTr>
                ) : filtered.length === 0 ? (
                  <UberTr>
                    <UberTd colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center text-neutral-400">
                        <Smartphone className="h-12 w-12 mb-3 text-neutral-300" />
                        <p className="text-base font-medium text-neutral-900">No device sessions yet</p>
                        <p className="text-sm mt-1">Sessions are recorded automatically as users open the app.</p>
                      </div>
                    </UberTd>
                  </UberTr>
                ) : (
                  filtered.map((dev: any) => (
                    <UberTr key={dev.id}>
                      <UberTd>
                        <div className="flex flex-col">
                          <span className="font-medium text-neutral-900">{dev.userName}</span>
                          <span className="text-xs text-neutral-500 capitalize">{dev.userRole}</span>
                        </div>
                      </UberTd>
                      <UberTd>
                        <div className="flex items-center gap-2">
                          {dev.device_type === 'tablet' && <Tablet className="h-4 w-4 text-neutral-400" />}
                          {dev.device_type === 'mobile' && <Smartphone className="h-4 w-4 text-neutral-400" />}
                          {dev.device_type === 'desktop' && <Laptop className="h-4 w-4 text-neutral-400" />}
                          <span className="font-medium">{dev.device_label}</span>
                        </div>
                      </UberTd>
                      <UberTd className="text-sm text-neutral-500">{dev.app_version || "—"}</UberTd>
                      <UberTd className="text-sm">{format(new Date(dev.last_seen_at), "MMM d, h:mm a")}</UberTd>
                      <UberTd>
                        <UberStatus
                          status={dev.revoked ? "revoked" : "active"}
                          variant={dev.revoked ? "error" : "success"}
                        />
                      </UberTd>
                      <UberTd>
                        <div className="flex items-center gap-2 justify-end">
                          {dev.revoked ? (
                            <button
                              onClick={() => setRevoked.mutate({ id: dev.id, revoked: false })}
                              disabled={setRevoked.isPending}
                              className="p-2 hover:bg-neutral-100 rounded-md text-neutral-500"
                              title="Restore access"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setRevoked.mutate({ id: dev.id, revoked: true })}
                              disabled={setRevoked.isPending}
                              className="p-2 hover:bg-red-50 text-red-600 rounded-md"
                              title="Revoke (force logout on next load)"
                            >
                              <PowerOff className="h-4 w-4" />
                            </button>
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
      </div>
    </AdminShell>
  );
}
