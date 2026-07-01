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
  uberBtn,
} from "@/components/admin/AdminUI";
import { Tag, Plus, CheckCircle2, XCircle, Percent, Gift } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/offers")({
  component: AdminOffers,
});

function AdminOffers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-promotions-full"],
    staleTime: 30_000,
    queryFn: async () => {
      // @ts-ignore - bypassing types since table was just created
      const { data, error } = await supabase.from("promotions").select("*");
      if (error && error.code === '42P01') return [];
      if (error) throw error;
      return (data || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string, is_active: boolean }) => {
      // @ts-ignore
      const { error } = await supabase.from("promotions").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Promotion updated");
      queryClient.invalidateQueries({ queryKey: ["admin-promotions-full"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update promotion");
    }
  });

  const list = data ?? [];

  const filtered = useMemo(() => {
    if (!search) return list;
    const s = search.toLowerCase();
    return list.filter((p: any) =>
      [p.code, p.description].filter(Boolean).some((v) => (v as string).toLowerCase().includes(s)),
    );
  }, [list, search]);

  const kpis = useMemo(() => {
    const active = list.filter((p: any) => p.is_active);
    return {
      total: list.length,
      active: active.length,
      usage: list.reduce((acc: number, p: any) => acc + (p.times_used || 0), 0),
    };
  }, [list]);

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Marketing"
          title="Promotions & Offers"
          description="Manage discount codes, platform-wide campaigns, and user retention offers."
          actions={
            <button type="button" className={uberBtn.primary}>
              <Plus className="h-3.5 w-3.5" /> Create Offer
            </button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UberKpi label="Active Offers" value={isLoading ? "…" : kpis.active} Icon={Tag} accent="green" />
          <UberKpi label="Total Campaigns" value={isLoading ? "…" : kpis.total} Icon={Gift} />
          <UberKpi label="Total Uses" value={isLoading ? "…" : kpis.usage} Icon={Percent} accent="orange" />
        </div>

        <div className="mt-8">
          <UberFilterBar
            search={search}
            onSearch={setSearch}
            filters={[{ label: "Status" }, { label: "Type" }]}
            onExport={() => {}}
          />

          <UberTable>
            <UberThead>
              <tr>
                <UberTh>Promo Code</UberTh>
                <UberTh>Discount</UberTh>
                <UberTh>Usage Limit</UberTh>
                <UberTh>Status</UberTh>
                <UberTh>Created</UberTh>
                <UberTh className="w-[1%]" />
              </tr>
            </UberThead>
            <tbody>
              {isLoading ? (
                <UberTr>
                  <UberTd className="py-8 text-center text-neutral-500">Loading promotions…</UberTd>
                </UberTr>
              ) : filtered.length === 0 ? (
                <UberTr>
                  <UberTd className="py-8 text-center text-neutral-500">No promotions found (or table not created yet).</UberTd>
                </UberTr>
              ) : (
                filtered.map((p: any) => (
                  <UberTr key={p.id}>
                    <UberTd>
                      <div className="flex flex-col gap-1">
                        <div className="font-mono font-semibold tracking-wide text-brand-core uppercase text-sm">
                          {p.code}
                        </div>
                        {p.description && (
                          <div className="text-[11px] text-neutral-500 max-w-[200px] truncate" title={p.description}>
                            {p.description}
                          </div>
                        )}
                      </div>
                    </UberTd>
                    <UberTd className="font-medium text-neutral-800">
                      {p.discount_type === 'percentage' ? `${p.discount_value}% OFF` : 
                       p.discount_type === 'free_delivery' ? 'FREE DELIVERY' : 
                       `₦${p.discount_value.toLocaleString()} OFF`}
                    </UberTd>
                    <UberTd className="text-neutral-600">
                      {p.times_used} / {p.usage_limit || '∞'}
                    </UberTd>
                    <UberTd>
                      <UberStatus status={p.is_active ? 'active' : 'suspended'} />
                    </UberTd>
                    <UberTd className="text-neutral-500">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}
                    </UberTd>
                    <UberTd>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => toggleStatus.mutate({ id: p.id, is_active: !p.is_active })}
                          className={`rounded p-1.5 transition ${p.is_active ? 'hover:bg-red-50 text-red-600' : 'hover:bg-green-50 text-green-600'}`}
                          title={p.is_active ? "Deactivate" : "Activate"}
                        >
                          {p.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        </button>
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
