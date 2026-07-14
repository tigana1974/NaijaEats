import React, { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminRegion } from "@/hooks/useAdminScope";
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
import { Plus, MoreHorizontal, CheckCircle, Ban, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/stores")({
  component: AdminStores,
});

type TypeTab = "all" | "restaurant" | "chef" | "grocery" | "caterer";

function AdminStores() {
  const qc = useQueryClient();
  const { region, country, countryLabel } = useAdminRegion();
  const [tab, setTab] = useState<TypeTab>("all");
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      // Simulate API call. Will push to vendors table on real setup
      await new Promise(r => setTimeout(r, 1000));
      console.log("Onboarded vendor:", formData);
    },
    onSuccess: () => {
      toast.success("Vendor onboarded successfully (Pending Verification)");
      setIsOnboardOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-stores-full"] });
    },
    onError: (err: any) => {
      toast.error(`Failed to onboard vendor: ${err.message}`);
    }
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: "pending" | "approved" | "suspended" }) => {
      const { error } = await supabase.from("vendors").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vendor status updated");
      qc.invalidateQueries({ queryKey: ["admin-stores-full"] });
      setOpenMenuId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update status");
      setOpenMenuId(null);
    }
  });

  const { data: vendors, isLoading } = useQuery({
    queryKey: ["admin-stores-full", region],
    staleTime: 30_000,
    queryFn: async () => {
      let q = supabase
        .from("vendors")
        .select("id,name,type,status,city,country,created_at,address_line,description")
        .order("created_at", { ascending: false });
      if (country) q = q.eq("country", country);
      const { data, error } = await q;
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
          title={`Store list — ${countryLabel}`}
          description={country ? `Restaurants, chefs, grocery shops and caterers in ${countryLabel}.` : "Restaurants, chefs, grocery shops and caterers across United Kingdom and Nigeria."}
          actions={
            <button type="button" className={uberBtn.primary} onClick={() => setIsOnboardOpen(true)}>
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
              { id: "chef", label: "Chefs", count: counts.chef },
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
                  <UberTd colSpan={10} className="py-8 text-center text-neutral-500">Loading stores…</UberTd>
                </UberTr>
              ) : filtered.length === 0 ? (
                <UberTr>
                  <UberTd colSpan={10} className="py-8 text-center text-neutral-500">No stores match the current filter.</UberTd>
                </UberTr>
              ) : (
                filtered.map((v: any) => (
                  <React.Fragment key={v.id}>
                    <UberTr onClick={() => setExpandedId(expandedId === v.id ? null : v.id)} className="cursor-pointer hover:bg-muted/30">
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
                        —
                      </UberTd>
                      <UberTd className="text-neutral-500">
                        {v.created_at ? new Date(v.created_at).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </UberTd>
                      <UberTd>
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => setOpenMenuId(openMenuId === v.id ? null : v.id)}
                            className="rounded-full p-1.5 hover:bg-[oklch(0.965_0.003_260)]"
                          >
                            <MoreHorizontal className="h-4 w-4 text-neutral-500" />
                          </button>
                          {openMenuId === v.id && (
                            <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-md border border-border bg-card shadow-lg py-1">
                              <button
                                onClick={() => updateStatus.mutate({ id: v.id, status: "approved" })}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-emerald-600"
                              >
                                <CheckCircle className="h-4 w-4" /> Approve
                              </button>
                              <button
                                onClick={() => updateStatus.mutate({ id: v.id, status: "suspended" })}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-amber-600"
                              >
                                <Ban className="h-4 w-4" /> Suspend
                              </button>
                            </div>
                          )}
                        </div>
                      </UberTd>
                    </UberTr>
                    {expandedId === v.id && (
                      <tr className="border-t border-border bg-muted/20">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="font-medium mb-1">Contact & Location</div>
                              <div className="text-neutral-600">No phone provided (see owner profile)</div>
                              <div className="text-neutral-600">{[v.address_line, v.city, v.country].filter(Boolean).join(", ") || "No address provided"}</div>
                            </div>
                            <div>
                              <div className="font-medium mb-1">Description</div>
                              <div className="text-neutral-600 max-w-md">{v.description || "No description provided."}</div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </UberTable>
        </div>
      </div>

      <Sheet open={isOnboardOpen} onOpenChange={setIsOnboardOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto w-full">
          <SheetHeader>
            <SheetTitle>Onboard Vendor</SheetTitle>
            <SheetDescription>
              Create a new vendor profile. They will receive an email to claim their account.
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
              <label className="text-sm font-medium">Store Name</label>
              <input required name="name" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="e.g. Mama Put Express" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Store Type</label>
                <select name="type" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="restaurant">Restaurant</option>
                  <option value="chef">Chef</option>
                  <option value="grocery">Grocery Store</option>
                  <option value="caterer">Caterer</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <input required name="phone" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="+234..." />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Owner Email</label>
              <input required type="email" name="owner_email" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="owner@example.com" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">City</label>
              <input required name="city" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="e.g. Lagos" />
            </div>

            <SheetFooter className="mt-8 pt-4 border-t">
              <SheetClose asChild>
                <button type="button" className={uberBtn.secondary}>Cancel</button>
              </SheetClose>
              <button type="submit" disabled={createMutation.isPending} className={uberBtn.primary}>
                {createMutation.isPending ? "Onboarding..." : "Onboard Vendor"}
              </button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </AdminShell>
  );
}
