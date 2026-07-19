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
import { exportCsv } from "@/lib/csv";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated/admin/offers")({
  component: AdminOffers,
});

function AdminOffers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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

  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      const discountType = formData.discount_type === "fixed" ? "fixed_amount" : formData.discount_type;
      // promotions is not in the generated types yet
      const { error } = await (supabase as any).from("promotions").insert({
        code: String(formData.code).trim().toUpperCase(),
        description: formData.description || null,
        discount_type: discountType,
        discount_value: Number(formData.discount_value),
        usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
        ends_at: formData.expires_at ? new Date(`${formData.expires_at}T23:59:59`).toISOString() : null,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Offer created and live");
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-promotions-full"] });
    },
    onError: (err: any) => {
      toast.error(`Failed to create offer: ${err.message}`);
    }
  });

  const list = data ?? [];

  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(() => {
    return list.filter((p: any) => {
      if (statusFilter === "active" && !p.is_active) return false;
      if (statusFilter === "inactive" && p.is_active) return false;
      if (search) {
        const s = search.toLowerCase();
        if (![p.code, p.description].filter(Boolean).some((v) => (v as string).toLowerCase().includes(s))) return false;
      }
      return true;
    });
  }, [list, search, statusFilter]);

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
            <button type="button" className={uberBtn.primary} onClick={() => setIsCreateOpen(true)}>
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
            filters={[
              {
                label: "Status",
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ],
              },
            ]}
            onExport={() =>
              exportCsv(`promotions_${new Date().toISOString().slice(0, 10)}.csv`, filtered as any[], {
                Code: "code",
                Description: (r: any) => r.description ?? "",
                Type: (r: any) => r.discount_type ?? "",
                Value: "discount_value",
                "Usage limit": (r: any) => r.usage_limit ?? "",
                "Times used": (r: any) => r.times_used ?? 0,
                Active: (r: any) => (r.is_active ? "yes" : "no"),
                Ends: (r: any) => r.ends_at ?? "",
              })
            }
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
                  <UberTd colSpan={10} className="py-8 text-center text-neutral-500">Loading promotions…</UberTd>
                </UberTr>
              ) : filtered.length === 0 ? (
                <UberTr>
                  <UberTd colSpan={10} className="py-8 text-center text-neutral-500">No promotions found (or table not created yet).</UberTd>
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

      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto w-full">
          <SheetHeader>
            <SheetTitle>Create Offer</SheetTitle>
            <SheetDescription>
              Create a new promotion code. It will be active immediately.
            </SheetDescription>
          </SheetHeader>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              createMutation.mutate(Object.fromEntries(fd));
            }}
            className="mt-6 space-y-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">Promo Code</label>
              <input required name="code" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" placeholder="e.g. SUMMER2026" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <input name="description" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" placeholder="e.g. 10% off summer orders" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <select name="discount_type" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                  <option value="free_delivery">Free Delivery</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Value</label>
                <input required name="discount_value" type="number" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" placeholder="10" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Uses (Optional)</label>
                <input name="usage_limit" type="number" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" placeholder="e.g. 1000" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Expires At (Optional)</label>
                <input name="expires_at" type="date" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" />
              </div>
            </div>

            <SheetFooter className="mt-8 pt-4 border-t">
              <SheetClose asChild>
                <button type="button" className={uberBtn.secondary}>Cancel</button>
              </SheetClose>
              <button type="submit" disabled={createMutation.isPending} className={uberBtn.primary}>
                {createMutation.isPending ? "Creating..." : "Create Offer"}
              </button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </AdminShell>
  );
}
