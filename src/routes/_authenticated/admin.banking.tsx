// @ts-nocheck
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "@/components/admin/AdminUI";
import { Building2, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Landmark } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/banking")({
  component: AdminBanking,
});

function AdminBanking() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-banking-full"],
    staleTime: 30_000,
    queryFn: async () => {
      // @ts-ignore - bypassing types since table was just created
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*, profiles(full_name, email)");
        
      if (error && error.code === '42P01') return [];
      if (error) throw error;
      return (data || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      // @ts-ignore
      const { error } = await supabase.from("bank_accounts").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bank account updated");
      queryClient.invalidateQueries({ queryKey: ["admin-banking-full"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update bank account");
    }
  });

  const list = data ?? [];

  const filtered = useMemo(() => {
    if (!search) return list;
    const s = search.toLowerCase();
    return list.filter((b: any) =>
      [b.account_name, b.account_number, b.bank_name, (b.profiles as any)?.full_name].filter(Boolean).some((v) => (v as string).toLowerCase().includes(s)),
    );
  }, [list, search]);

  const kpis = useMemo(() => {
    return {
      total: list.length,
      verified: list.filter((b: any) => b.status === "verified").length,
      pending: list.filter((b: any) => b.status === "pending").length,
      rejected: list.filter((b: any) => b.status === "rejected").length,
    };
  }, [list]);

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Finance"
          title="Banking & Payout Accounts"
          description="Verify vendor and rider bank accounts before processing payouts."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UberKpi label="Total Accounts" value={isLoading ? "…" : kpis.total} Icon={Landmark} />
          <UberKpi label="Verified" value={isLoading ? "…" : kpis.verified} Icon={ShieldCheck} accent="green" />
          <UberKpi label="Awaiting Review" value={isLoading ? "…" : kpis.pending} Icon={Building2} accent="orange" />
          <UberKpi label="Rejected" value={isLoading ? "…" : kpis.rejected} Icon={AlertTriangle} accent="red" />
        </div>

        <div className="mt-8">
          <UberFilterBar
            search={search}
            onSearch={setSearch}
            filters={[{ label: "User Type" }, { label: "Status" }]}
            onExport={() => {}}
          />

          <UberTable>
            <UberThead>
              <tr>
                <UberTh>Account Details</UberTh>
                <UberTh>User</UberTh>
                <UberTh>Bank Name</UberTh>
                <UberTh>Status</UberTh>
                <UberTh>Added</UberTh>
                <UberTh className="w-[1%]" />
              </tr>
            </UberThead>
            <tbody>
              {isLoading ? (
                <UberTr>
                  <UberTd colSpan={10} className="py-8 text-center text-neutral-500">Loading bank accounts…</UberTd>
                </UberTr>
              ) : filtered.length === 0 ? (
                <UberTr>
                  <UberTd colSpan={10} className="py-8 text-center text-neutral-500">No bank accounts found (or table not created yet).</UberTd>
                </UberTr>
              ) : (
                filtered.map((b: any) => (
                  <UberTr key={b.id}>
                    <UberTd>
                      <div className="flex flex-col gap-1">
                        <div className="font-medium text-[oklch(0.18_0.006_260)]">{b.account_name}</div>
                        <div className="font-mono text-[11px] text-neutral-500 tracking-wider">
                          {b.account_number}
                          {b.sort_code && ` • SC: ${b.sort_code}`}
                        </div>
                      </div>
                    </UberTd>
                    <UberTd className="text-neutral-600">
                      <div>{(b.profiles as any)?.full_name || "Unknown"}</div>
                      <div className="text-[11px] text-neutral-500 capitalize">{b.user_type}</div>
                    </UberTd>
                    <UberTd className="font-medium">
                      {b.bank_name}
                    </UberTd>
                    <UberTd>
                      <UberStatus status={b.status === 'verified' ? 'active' : b.status === 'pending' ? 'pending' : 'suspended'} />
                    </UberTd>
                    <UberTd className="text-neutral-500">
                      {b.created_at ? new Date(b.created_at).toLocaleDateString() : "—"}
                    </UberTd>
                    <UberTd>
                      <div className="flex items-center gap-2">
                        {b.status === "pending" && (
                          <>
                            <button 
                              onClick={() => updateStatus.mutate({ id: b.id, status: "verified" })}
                              className="rounded p-1.5 hover:bg-green-50 text-green-600 transition"
                              title="Verify"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => updateStatus.mutate({ id: b.id, status: "rejected" })}
                              className="rounded p-1.5 hover:bg-red-50 text-red-600 transition"
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
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
