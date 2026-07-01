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
import { MessageSquare, Star, ThumbsDown, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/reviews")({
  component: AdminReviews,
});

function AdminReviews() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reviews-full"],
    staleTime: 30_000,
    queryFn: async () => {
      // @ts-ignore - bypassing types since table was just created
      const { data, error } = await supabase
        .from("reviews")
        .select("*, vendors(name), profiles(full_name, email)");
      
      if (error && error.code === '42P01') {
        // Table doesn't exist yet on remote, return empty array to not break UI
        return [];
      }
      if (error) throw error;
      return (data || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      // @ts-ignore
      const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Review status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-reviews-full"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update review");
    }
  });

  const list = data ?? [];

  const filtered = useMemo(() => {
    if (!search) return list;
    const s = search.toLowerCase();
    return list.filter((r: any) =>
      [r.comment, (r.vendors as any)?.name, (r.profiles as any)?.full_name].filter(Boolean).some((v) => (v as string).toLowerCase().includes(s)),
    );
  }, [list, search]);

  const kpis = useMemo(() => {
    return {
      total: list.length,
      avgRating: list.length ? (list.reduce((acc: number, r: any) => acc + (r.rating || 0), 0) / list.length).toFixed(1) : "0.0",
      flagged: list.filter((r: any) => r.status === "flagged" || r.rating <= 2).length,
      hidden: list.filter((r: any) => r.status === "hidden").length,
    };
  }, [list]);

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Feedback"
          title="Reviews"
          description="Moderate customer reviews for vendors and dishes."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UberKpi label="Total Reviews" value={isLoading ? "…" : kpis.total} Icon={MessageSquare} />
          <UberKpi label="Avg Rating" value={isLoading ? "…" : kpis.avgRating} Icon={Star} accent="green" />
          <UberKpi label="Low Ratings / Flagged" value={isLoading ? "…" : kpis.flagged} Icon={ThumbsDown} accent="orange" />
          <UberKpi label="Hidden by Admin" value={isLoading ? "…" : kpis.hidden} Icon={ShieldAlert} accent="ink" />
        </div>

        <div className="mt-8">
          <UberFilterBar
            search={search}
            onSearch={setSearch}
            filters={[{ label: "Rating" }, { label: "Status" }]}
            onExport={() => {}}
          />

          <UberTable>
            <UberThead>
              <tr>
                <UberTh>Review</UberTh>
                <UberTh>Vendor</UberTh>
                <UberTh>Customer</UberTh>
                <UberTh>Status</UberTh>
                <UberTh>Date</UberTh>
                <UberTh className="w-[1%]" />
              </tr>
            </UberThead>
            <tbody>
              {isLoading ? (
                <UberTr>
                  <UberTd className="py-8 text-center text-neutral-500">Loading reviews…</UberTd>
                </UberTr>
              ) : filtered.length === 0 ? (
                <UberTr>
                  <UberTd className="py-8 text-center text-neutral-500">No reviews found (or table not created yet).</UberTd>
                </UberTr>
              ) : (
                filtered.map((r: any) => (
                  <UberTr key={r.id}>
                    <UberTd>
                      <div className="flex flex-col gap-1 max-w-[300px]">
                        <div className="flex text-amber-500 text-xs">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-current" : "text-neutral-300"}`} />
                          ))}
                        </div>
                        <div className="text-sm text-neutral-800 line-clamp-2" title={r.comment}>
                          {r.comment || <span className="text-neutral-400 italic">No comment left</span>}
                        </div>
                      </div>
                    </UberTd>
                    <UberTd className="font-medium text-neutral-800">
                      {(r.vendors as any)?.name || "—"}
                    </UberTd>
                    <UberTd className="text-neutral-600">
                      {(r.profiles as any)?.full_name || "Unknown Customer"}
                    </UberTd>
                    <UberTd>
                      <UberStatus status={r.status === 'published' ? 'active' : 'suspended'} />
                    </UberTd>
                    <UberTd className="text-neutral-500">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
                    </UberTd>
                    <UberTd>
                      <div className="flex items-center gap-2">
                        {r.status !== "published" && (
                          <button 
                            onClick={() => updateStatus.mutate({ id: r.id, status: "published" })}
                            className="rounded p-1.5 hover:bg-green-50 text-green-600 transition"
                            title="Approve / Publish"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                        {r.status !== "hidden" && (
                          <button 
                            onClick={() => updateStatus.mutate({ id: r.id, status: "hidden" })}
                            className="rounded p-1.5 hover:bg-red-50 text-red-600 transition"
                            title="Hide Review"
                          >
                            <XCircle className="h-4 w-4" />
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
    </AdminShell>
  );
}
