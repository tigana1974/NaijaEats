import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminScope } from "@/hooks/useAdminScope";
import {
  UberPageTitle,
  UberTable,
  UberThead,
  UberTh,
  UberTr,
  UberTd,
  uberBtn,
} from "@/components/admin/AdminUI";
import { Copy, KeyRound, ShieldCheck, ScrollText, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/access")({
  component: AdminAccess,
});

const COUNTRY_LABEL: Record<string, string> = { NG: "Nigeria", UK: "United Kingdom" };

function AdminAccess() {
  const scope = useAdminScope();
  const qc = useQueryClient();
  const [newCountry, setNewCountry] = useState<"NG" | "UK">("NG");
  const [newLabel, setNewLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [freshCode, setFreshCode] = useState<{ code: string; country: "NG" | "UK" } | null>(null);

  const { data: codes } = useQuery({
    queryKey: ["admin-access-codes"],
    enabled: scope.isParent,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_access_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: team } = useQuery({
    queryKey: ["admin-team"],
    enabled: scope.isParent,
    queryFn: async () => {
      const [{ data: roles }, { data: members }] = await Promise.all([
        supabase.from("user_roles").select("user_id").eq("role", "admin"),
        supabase.from("admin_members").select("user_id, is_parent"),
      ]);
      const ids = (roles ?? []).map((r) => r.user_id);
      if (ids.length === 0) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone, created_at")
        .in("id", ids);
      const parentSet = new Set((members ?? []).filter((m) => m.is_parent).map((m) => m.user_id));
      return (profiles ?? []).map((p) => ({ ...p, isParent: parentSet.has(p.id) }));
    },
  });

  const { data: audit } = useQuery({
    queryKey: ["admin-audit-log"],
    enabled: scope.isParent,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const entries = data ?? [];
      const userIds = [...new Set(entries.map((e) => e.user_id).filter(Boolean))] as string[];
      let names = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
        names = new Map((profiles ?? []).map((p) => [p.id, p.full_name || p.id.slice(0, 8)]));
      }
      return entries.map((e) => ({ ...e, actorName: e.user_id ? names.get(e.user_id) ?? e.user_id.slice(0, 8) : "system" }));
    },
  });

  const { data: myUserId } = useQuery({
    queryKey: ["my-user-id"],
    queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null,
  });

  const createCode = async () => {
    setCreating(true);
    try {
      const { data, error } = await supabase.rpc("create_admin_access_code", {
        p_country: newCountry,
        p_label: newLabel.trim() || undefined,
      });
      if (error) throw error;
      const res = data as { code: string };
      setFreshCode({ code: res.code, country: newCountry });
      setNewLabel("");
      qc.invalidateQueries({ queryKey: ["admin-access-codes"] });
      qc.invalidateQueries({ queryKey: ["admin-audit-log"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create code");
    } finally {
      setCreating(false);
    }
  };

  const toggleCode = async (id: string, active: boolean) => {
    const { error } = await supabase.rpc("set_admin_code_active", { p_id: id, p_active: active });
    if (error) return toast.error(error.message);
    toast.success(active ? "Code reactivated" : "Code deactivated");
    qc.invalidateQueries({ queryKey: ["admin-access-codes"] });
    qc.invalidateQueries({ queryKey: ["admin-audit-log"] });
  };

  const setParent = async (userId: string, isParent: boolean) => {
    if (userId === myUserId && !isParent) {
      toast.error("You can't demote your own account — ask another parent admin.");
      return;
    }
    const { error } = await supabase
      .from("admin_members")
      .upsert({ user_id: userId, is_parent: isParent });
    if (error) return toast.error(error.message);
    toast.success(isParent ? "Promoted to parent admin" : "Set as country manager");
    qc.invalidateQueries({ queryKey: ["admin-team"] });
    qc.invalidateQueries({ queryKey: ["admin-audit-log"] });
  };

  if (!scope.loading && !scope.isParent) {
    return (
      <AdminShell>
        <div className="mx-auto max-w-xl px-4 py-24 text-center">
          <Lock className="mx-auto h-8 w-8 text-neutral-400" />
          <h1 className="mt-3 font-display text-xl font-semibold">Parent admin only</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Access codes and the audit trail are managed by the parent admin account.
          </p>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Access control"
          title="Regional access & audit"
          description="Create per-country access codes for your UK and Nigeria managers, and see exactly who changed what, and when."
        />

        {/* Create code */}
        <section className="rounded-2xl border border-[oklch(0.92_0.003_260)] bg-white p-5">
          <div className="flex items-center gap-2 font-semibold">
            <KeyRound className="h-4 w-4 text-[var(--naija-green)]" /> New access code
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              value={newCountry}
              onChange={(e) => setNewCountry(e.target.value as "NG" | "UK")}
              className="rounded-lg border border-[oklch(0.92_0.003_260)] px-3 py-2 text-sm"
            >
              <option value="NG">Nigeria</option>
              <option value="UK">United Kingdom</option>
            </select>
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Label (e.g. Ada — Lagos manager)"
              className="min-w-[220px] flex-1 rounded-lg border border-[oklch(0.92_0.003_260)] px-3 py-2 text-sm"
            />
            <button type="button" onClick={createCode} disabled={creating} className={uberBtn.primary}>
              {creating ? "Creating…" : "Generate code"}
            </button>
          </div>
          {freshCode && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-[oklch(0.96_0.03_145)] px-4 py-3">
              <div className="text-sm">
                <span className="font-semibold">{COUNTRY_LABEL[freshCode.country]}</span> code — share it with the
                manager privately:
              </div>
              <code className="rounded-lg bg-white px-3 py-1.5 font-mono text-base font-bold tracking-[0.2em]">
                {freshCode.code}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(freshCode.code);
                  toast.success("Code copied");
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[oklch(0.88_0.02_145)] bg-white px-2.5 py-1.5 text-xs font-medium"
              >
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
            </div>
          )}

          <div className="mt-4">
            <UberTable>
              <UberThead>
                <tr>
                  <UberTh>Code</UberTh>
                  <UberTh>Region</UberTh>
                  <UberTh>Label</UberTh>
                  <UberTh>Uses</UberTh>
                  <UberTh>Last used</UberTh>
                  <UberTh>Status</UberTh>
                  <UberTh className="w-[1%]" />
                </tr>
              </UberThead>
              <tbody>
                {(codes ?? []).length === 0 ? (
                  <UberTr>
                    <UberTd colSpan={7} className="py-6 text-center text-neutral-500">
                      No codes yet. Generate one per manager above.
                    </UberTd>
                  </UberTr>
                ) : (
                  (codes ?? []).map((c: any) => (
                    <UberTr key={c.id}>
                      <UberTd className="font-mono font-semibold tracking-widest">{c.code}</UberTd>
                      <UberTd>{COUNTRY_LABEL[c.country] ?? c.country}</UberTd>
                      <UberTd className="text-neutral-600">{c.label || "—"}</UberTd>
                      <UberTd>{c.use_count}</UberTd>
                      <UberTd className="text-neutral-500">
                        {c.last_used_at ? new Date(c.last_used_at).toLocaleString() : "Never"}
                      </UberTd>
                      <UberTd>
                        <StatusChip ok={c.active} okLabel="Active" badLabel="Deactivated" />
                      </UberTd>
                      <UberTd>
                        <button
                          type="button"
                          onClick={() => toggleCode(c.id, !c.active)}
                          className="rounded-lg border border-[oklch(0.92_0.003_260)] px-2.5 py-1 text-xs hover:bg-[oklch(0.965_0.003_260)]"
                        >
                          {c.active ? "Deactivate" : "Reactivate"}
                        </button>
                      </UberTd>
                    </UberTr>
                  ))
                )}
              </tbody>
            </UberTable>
          </div>
        </section>

        {/* Admin team */}
        <section className="mt-8 rounded-2xl border border-[oklch(0.92_0.003_260)] bg-white p-5">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="h-4 w-4 text-[var(--naija-green)]" /> Admin team
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Parent admins access both regions freely. Managers must enter a country code each session.
            Grant admin role itself from Users &amp; roles.
          </p>
          <div className="mt-3">
            <UberTable>
              <UberThead>
                <tr>
                  <UberTh>Admin</UberTh>
                  <UberTh>Level</UberTh>
                  <UberTh>Joined</UberTh>
                  <UberTh className="w-[1%]" />
                </tr>
              </UberThead>
              <tbody>
                {(team ?? []).map((t: any) => (
                  <UberTr key={t.id}>
                    <UberTd>
                      <div className="font-medium">{t.full_name || "Unnamed"}</div>
                      <div className="font-mono text-[11px] text-neutral-500">#{String(t.id).slice(0, 8)}</div>
                    </UberTd>
                    <UberTd>
                      <StatusChip ok={t.isParent} okLabel="Parent admin" badLabel="Country manager" neutralBad />
                    </UberTd>
                    <UberTd className="text-neutral-500">
                      {t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}
                    </UberTd>
                    <UberTd>
                      <button
                        type="button"
                        onClick={() => setParent(t.id, !t.isParent)}
                        disabled={t.id === myUserId}
                        className="rounded-lg border border-[oklch(0.92_0.003_260)] px-2.5 py-1 text-xs hover:bg-[oklch(0.965_0.003_260)] disabled:opacity-40"
                      >
                        {t.isParent ? "Make manager" : "Make parent"}
                      </button>
                    </UberTd>
                  </UberTr>
                ))}
              </tbody>
            </UberTable>
          </div>
        </section>

        {/* Audit trail */}
        <section className="mt-8 rounded-2xl border border-[oklch(0.92_0.003_260)] bg-white p-5">
          <div className="flex items-center gap-2 font-semibold">
            <ScrollText className="h-4 w-4 text-[var(--naija-green)]" /> Audit trail
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Every admin change is recorded automatically — data edits, unlocks, region switches, and code activity.
          </p>
          <div className="mt-3">
            <UberTable>
              <UberThead>
                <tr>
                  <UberTh>When</UberTh>
                  <UberTh>Who</UberTh>
                  <UberTh>Action</UberTh>
                  <UberTh>What</UberTh>
                </tr>
              </UberThead>
              <tbody>
                {(audit ?? []).length === 0 ? (
                  <UberTr>
                    <UberTd colSpan={4} className="py-6 text-center text-neutral-500">
                      Nothing logged yet. Actions appear here as admins work.
                    </UberTd>
                  </UberTr>
                ) : (
                  (audit ?? []).map((e: any) => (
                    <UberTr key={e.id}>
                      <UberTd className="whitespace-nowrap text-neutral-500">
                        {new Date(e.created_at).toLocaleString()}
                      </UberTd>
                      <UberTd className="font-medium">{e.actorName}</UberTd>
                      <UberTd>
                        <span className="rounded-full bg-[oklch(0.965_0.003_260)] px-2 py-0.5 text-[11.5px] font-medium">
                          {formatAction(e.action)}
                          {e.country ? ` · ${e.country}` : ""}
                        </span>
                      </UberTd>
                      <UberTd className="max-w-[420px] text-neutral-600">
                        <span className="line-clamp-2" title={e.details ? JSON.stringify(e.details, null, 2) : undefined}>
                          {describeEntry(e)}
                        </span>
                      </UberTd>
                    </UberTr>
                  ))
                )}
              </tbody>
            </UberTable>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function StatusChip({ ok, okLabel, badLabel, neutralBad }: { ok: boolean; okLabel: string; badLabel: string; neutralBad?: boolean }) {
  const cls = ok
    ? "bg-[oklch(0.95_0.05_145)] text-[var(--naija-green-dark)]"
    : neutralBad
      ? "bg-[oklch(0.95_0.005_260)] text-[oklch(0.32_0.006_260)]"
      : "bg-[oklch(0.95_0.03_15)] text-[oklch(0.42_0.16_15)]";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-medium ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-90" />
      {ok ? okLabel : badLabel}
    </span>
  );
}

function formatAction(action: string) {
  return action.replace(/_/g, " ");
}

function describeEntry(e: any): string {
  const ref = e.table_name ? `${e.table_name}${e.record_id ? ` #${String(e.record_id).slice(0, 8)}` : ""}` : "";
  if (e.action === "update" && e.details && typeof e.details === "object") {
    const fields = Object.keys(e.details).join(", ");
    return `${ref}: changed ${fields}`;
  }
  if (e.action === "insert") return `${ref}: created`;
  if (e.action === "delete") return `${ref}: deleted`;
  if (e.action === "panel_unlocked") return "Unlocked the panel with an access code";
  if (e.action === "region_switched") return "Switched the active region";
  if (e.action === "code_created") return `Created an access code${e.details?.label ? ` (${e.details.label})` : ""}`;
  if (e.action === "code_deactivated") return "Deactivated an access code";
  if (e.action === "code_activated") return "Reactivated an access code";
  return ref || "—";
}
