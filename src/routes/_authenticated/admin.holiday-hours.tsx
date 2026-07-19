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
  uberBtn,
} from "@/components/admin/AdminUI";
import { CalendarClock, CalendarX, ShieldCheck, Search, Plus, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
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

export const Route = createFileRoute("/_authenticated/admin/holiday-hours")({
  component: AdminHolidayHours,
});

type StoreHoliday = {
  id: string;
  vendor_id: string | null;
  date: string;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
  reason: string;
  vendors?: { name: string } | null;
};

function AdminHolidayHours() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: holidays, isLoading } = useQuery({
    queryKey: ["admin-holiday-hours"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_holidays")
        .select("*, vendors(name)")
        .order("date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as StoreHoliday[];
    },
  });

  const { data: vendorOptions } = useQuery({
    queryKey: ["admin-holiday-vendor-options"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("id,name")
        .eq("status", "approved")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { data: u } = await supabase.auth.getUser();
      const isClosed = formData.mode !== "reduced";
      const { error } = await supabase.from("store_holidays").insert({
        vendor_id: formData.vendor_id || null, // empty = platform-wide
        date: formData.date,
        is_closed: isClosed,
        open_time: isClosed ? null : formData.open_time || null,
        close_time: isClosed ? null : formData.close_time || null,
        reason: formData.reason || "",
        created_by: u.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Closure scheduled");
      setIsCreateOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-holiday-hours"] });
    },
    onError: (err: any) => toast.error(`Failed to schedule: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("store_holidays").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Override removed");
      qc.invalidateQueries({ queryKey: ["admin-holiday-hours"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to remove"),
  });

  const list = holidays ?? [];
  const filtered = list.filter((h) =>
    (h.vendors?.name ?? "All stores").toLowerCase().includes(search.toLowerCase()) ||
    (h.reason ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const kpis = {
    closures: list.filter((h) => h.is_closed).length,
    reduced: list.filter((h) => !h.is_closed).length,
    global: list.filter((h) => !h.vendor_id).length,
  };

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Logistics"
          title="Holiday Hours & Closures"
          description="Schedule store closures or special operating hours — per store or platform-wide."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-8">
          <UberKpi label="Scheduled Closures" value={isLoading ? "…" : kpis.closures} Icon={CalendarX} accent="red" />
          <UberKpi label="Reduced Hours" value={isLoading ? "…" : kpis.reduced} Icon={CalendarClock} accent="orange" />
          <UberKpi label="Platform-wide Overrides" value={isLoading ? "…" : kpis.global} Icon={ShieldCheck} accent="ink" />
        </div>

        <div className="mt-8">
          <div className="rounded-xl border border-border bg-card p-0 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border p-5 bg-neutral-50/50 gap-4">
              <h3 className="font-semibold text-lg">Upcoming Store Overrides</h3>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search store or reason..."
                    className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-core"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-md bg-brand-clay px-4 py-2 text-sm font-medium text-brand-cream hover:bg-neutral-800 whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Closure</span>
                </button>
              </div>
            </div>

            <UberTable>
              <UberThead>
                <tr>
                  <UberTh>Store</UberTh>
                  <UberTh>Date</UberTh>
                  <UberTh>Type</UberTh>
                  <UberTh>Hours</UberTh>
                  <UberTh>Reason</UberTh>
                  <UberTh></UberTh>
                </tr>
              </UberThead>
              <tbody>
                {isLoading ? (
                  <UberTr><UberTd colSpan={6} className="text-center py-8">Loading schedules...</UberTd></UberTr>
                ) : filtered.length === 0 ? (
                  <UberTr>
                    <UberTd colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center text-neutral-400">
                        <CalendarIcon className="h-12 w-12 mb-3 text-neutral-300" />
                        <p className="text-base font-medium text-neutral-900">No holiday hours scheduled</p>
                        <p className="text-sm mt-1">Use "Add Closure" to schedule the first override.</p>
                      </div>
                    </UberTd>
                  </UberTr>
                ) : (
                  filtered.map((hol) => (
                    <UberTr key={hol.id}>
                      <UberTd className="font-medium text-neutral-900">
                        {hol.vendors?.name ?? <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-neutral-400" /> All stores</span>}
                      </UberTd>
                      <UberTd>
                        <span className="font-medium">{format(new Date(hol.date), "MMM d, yyyy")}</span>
                      </UberTd>
                      <UberTd>
                        <UberStatus
                          status={hol.is_closed ? "closed" : "reduced hours"}
                          variant={hol.is_closed ? "error" : "warning"}
                        />
                      </UberTd>
                      <UberTd>
                        {hol.is_closed ? (
                          <span className="text-neutral-500">All day</span>
                        ) : (
                          <span className="text-sm font-medium">{hol.open_time?.substring(0,5)} - {hol.close_time?.substring(0,5)}</span>
                        )}
                      </UberTd>
                      <UberTd className="text-neutral-600 max-w-[200px] truncate">{hol.reason || "—"}</UberTd>
                      <UberTd>
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => deleteMutation.mutate(hol.id)}
                            disabled={deleteMutation.isPending}
                            className="rounded-md p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                            title="Remove override"
                          >
                            <Trash2 className="h-4 w-4" />
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
      </div>

      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto w-full">
          <SheetHeader>
            <SheetTitle>Add Closure / Special Hours</SheetTitle>
            <SheetDescription>
              Leave the store empty to apply the override to every store on the platform.
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
              <label className="text-sm font-medium">Store</label>
              <select name="vendor_id" defaultValue="" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">All stores (platform-wide)</option>
                {(vendorOptions ?? []).map((v: any) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <input required name="date" type="date" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <select name="mode" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="closed">Closed all day</option>
                  <option value="reduced">Reduced hours</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Opens (if reduced)</label>
                <input name="open_time" type="time" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Closes (if reduced)</label>
                <input name="close_time" type="time" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reason</label>
              <input name="reason" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="e.g. Christmas Day" />
            </div>

            <SheetFooter className="mt-8 pt-4 border-t">
              <SheetClose asChild>
                <button type="button" className={uberBtn.secondary}>Cancel</button>
              </SheetClose>
              <button type="submit" disabled={createMutation.isPending} className={uberBtn.primary}>
                {createMutation.isPending ? "Saving..." : "Schedule"}
              </button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </AdminShell>
  );
}
