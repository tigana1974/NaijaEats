import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
import { CalendarClock, CalendarX, ShieldCheck, Search, Plus, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/admin/holiday-hours")({
  component: AdminHolidayHours,
});

type StoreHoliday = {
  id: string;
  vendor_id: string;
  date: string;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
  reason: string;
  vendors?: { name: string };
};

function AdminHolidayHours() {
  const [search, setSearch] = useState("");

  const { data: holidays, isLoading } = useQuery({
    queryKey: ["admin-holiday-hours"],
    queryFn: async () => {
      // In a real app we'd fetch this from a store_holidays table.
      // Since it doesn't exist in our base schema yet, we will mock it for the UI.
      return [
        {
          id: "1", vendor_id: "v1", date: "2026-12-25", is_closed: true, open_time: null, close_time: null, reason: "Christmas Day",
          vendors: { name: "Iya Basira's Buka" }
        },
        {
          id: "2", vendor_id: "v2", date: "2026-01-01", is_closed: false, open_time: "12:00:00", close_time: "20:00:00", reason: "New Year's Day Reduced Hours",
          vendors: { name: "Chicken Republic" }
        },
        {
          id: "3", vendor_id: "v3", date: "2026-10-01", is_closed: true, open_time: null, close_time: null, reason: "Independence Day",
          vendors: { name: "Mega Groceries" }
        }
      ] as StoreHoliday[];
    },
  });

  const filtered = holidays?.filter(h => h.vendors?.name.toLowerCase().includes(search.toLowerCase())) || [];

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Logistics"
          title="Holiday Hours & Closures"
          description="View and override store holiday closures or special operating hours."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-8">
          <UberKpi label="Upcoming Closures" value={isLoading ? "…" : holidays?.filter(h => h.is_closed).length || 0} Icon={CalendarX} accent="red" />
          <UberKpi label="Reduced Hours" value={isLoading ? "…" : holidays?.filter(h => !h.is_closed).length || 0} Icon={CalendarClock} accent="orange" />
          <UberKpi label="Admin Overrides" value={0} Icon={ShieldCheck} accent="ink" />
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
                    placeholder="Search store..."
                    className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-core"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <button className="flex items-center justify-center gap-2 rounded-md bg-brand-clay px-4 py-2 text-sm font-medium text-brand-cream hover:bg-neutral-800">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Global Closure</span>
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
                      </div>
                    </UberTd>
                  </UberTr>
                ) : (
                  filtered.map((hol) => (
                    <UberTr key={hol.id}>
                      <UberTd className="font-medium text-neutral-900">{hol.vendors?.name}</UberTd>
                      <UberTd>
                        <span className="font-medium">{format(new Date(hol.date), "MMM d, yyyy")}</span>
                      </UberTd>
                      <UberTd>
                        <UberStatus 
                          status={hol.is_closed ? "closed" : "reduced_hours"} 
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
                      <UberTd className="text-neutral-600 max-w-[200px] truncate">{hol.reason}</UberTd>
                      <UberTd>
                        <div className="flex items-center justify-end">
                          <button className="text-sm font-medium text-brand-core hover:underline">Edit</button>
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
