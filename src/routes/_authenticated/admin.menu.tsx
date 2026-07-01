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
  formatMoney,
} from "@/components/admin/AdminUI";
import { UtensilsCrossed, ShoppingBasket, PackageOpen, AlertTriangle, EyeOff, Eye } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/menu")({
  component: AdminMenu,
});

function AdminMenu() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-menu-items-full"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*, vendors(name, type)");
      if (error) throw error;
      return data;
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, is_available }: { id: string, is_available: boolean }) => {
      const { error } = await supabase.from("menu_items").update({ is_available }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item updated");
      queryClient.invalidateQueries({ queryKey: ["admin-menu-items-full"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update item");
    }
  });

  const list = data ?? [];

  const filtered = useMemo(() => {
    if (!search) return list;
    const s = search.toLowerCase();
    return list.filter((item) =>
      [item.name, (item.vendors as any)?.name].filter(Boolean).some((v) => (v as string).toLowerCase().includes(s)),
    );
  }, [list, search]);

  const kpis = useMemo(() => {
    const dishes = list.filter(i => (i.vendors as any)?.type !== 'grocery');
    const groceries = list.filter(i => (i.vendors as any)?.type === 'grocery');
    
    return {
      activeDishes: dishes.filter(i => i.is_available).length,
      activeGroceries: groceries.filter(i => i.is_available).length,
      outOfStock: list.filter(i => !i.is_available).length,
    };
  }, [list]);

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Platform Content"
          title="Menu & Products"
          description="Global view of all restaurant dishes and grocery products on NaijaEats."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UberKpi label="Active Dishes" value={isLoading ? "…" : kpis.activeDishes} Icon={UtensilsCrossed} accent="green" />
          <UberKpi label="Grocery SKUs" value={isLoading ? "…" : kpis.activeGroceries} Icon={ShoppingBasket} accent="orange" />
          <UberKpi label="Hidden / Out of Stock" value={isLoading ? "…" : kpis.outOfStock} Icon={PackageOpen} accent="ink" />
          <UberKpi label="Flagged Items" value={0} Icon={AlertTriangle} accent="red" />
        </div>

        <div className="mt-8">
          <UberFilterBar
            search={search}
            onSearch={setSearch}
            filters={[{ label: "Vendor Type" }, { label: "Status" }]}
            onExport={() => {}}
          />

          <UberTable>
            <UberThead>
              <tr>
                <UberTh>Item</UberTh>
                <UberTh>Vendor</UberTh>
                <UberTh>Price</UberTh>
                <UberTh>Status</UberTh>
                <UberTh className="w-[1%]" />
              </tr>
            </UberThead>
            <tbody>
              {isLoading ? (
                <UberTr>
                  <UberTd className="py-8 text-center text-neutral-500">Loading menu items…</UberTd>
                </UberTr>
              ) : filtered.length === 0 ? (
                <UberTr>
                  <UberTd className="py-8 text-center text-neutral-500">No items found.</UberTd>
                </UberTr>
              ) : (
                filtered.map((item) => (
                  <UberTr key={item.id}>
                    <UberTd>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                          {item.image_url ? (
                            <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-neutral-400">
                              <UtensilsCrossed className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-[oklch(0.18_0.006_260)]">{item.name}</div>
                          {item.description && (
                            <div className="text-[11px] text-neutral-500 truncate max-w-[200px]">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </UberTd>
                    <UberTd className="text-neutral-600">
                      <div className="font-medium">{(item.vendors as any)?.name || "Unknown"}</div>
                      <div className="text-[11px] text-neutral-500 capitalize">{(item.vendors as any)?.type?.replace('_', ' ')}</div>
                    </UberTd>
                    <UberTd className="font-medium">
                      {formatMoney(item.price, item.currency)}
                    </UberTd>
                    <UberTd>
                      {item.is_available ? <UberStatus status="active" /> : <UberStatus status="suspended" />}
                    </UberTd>
                    <UberTd>
                      <button 
                        onClick={() => toggleStatus.mutate({ id: item.id, is_available: !item.is_available })}
                        className="rounded p-1.5 hover:bg-neutral-100 text-neutral-600 transition"
                        title={item.is_available ? "Hide Item" : "Show Item"}
                      >
                        {item.is_available ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
