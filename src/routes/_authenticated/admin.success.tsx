// @ts-nocheck
import { useMemo } from "react";
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
} from "@/components/admin/AdminUI";
import { TrendingUp, Star, Store, ShieldCheck } from "lucide-react";
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis
} from "recharts";

export const Route = createFileRoute("/_authenticated/admin/success")({
  component: AdminSuccess,
});

function AdminSuccess() {
  const { data: vendors, isLoading } = useQuery({
    queryKey: ["admin-success-benchmarking"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select(`
          id, name, type, rating, rating_count, status
        `)
        .eq('status', 'approved');
      
      if (error) throw error;
      return data || [];
    },
  });

  const { chartData, kpis } = useMemo(() => {
    if (!vendors) return { chartData: [], kpis: { total: 0, avgRating: 0, topRated: 0 } };
    
    let totalRating = 0;
    let count = 0;
    let topCount = 0;

    const plot = vendors.map(v => {
      const rating = Number(v.rating || 0);
      const reviews = Number(v.rating_count || 0);
      
      if (reviews > 0) {
        totalRating += rating;
        count++;
        if (rating >= 4.5) topCount++;
      }
      
      return {
        name: v.name,
        type: v.type,
        rating,
        reviews,
      };
    }).filter(v => v.reviews > 0);

    return {
      chartData: plot,
      kpis: {
        total: vendors.length,
        avgRating: count > 0 ? (totalRating / count) : 0,
        topRated: count > 0 ? (topCount / count) * 100 : 0
      }
    };
  }, [vendors]);

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Analytics"
          title="Success & Benchmarking"
          description="Vendor health scoring and market performance comparisons."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-8">
          <UberKpi label="Active Vendors" value={isLoading ? "…" : kpis.total} Icon={Store} />
          <UberKpi label="Avg Platform Rating" value={isLoading ? "…" : kpis.avgRating.toFixed(1)} Icon={Star} accent="orange" />
          <UberKpi label="Top Rated (4.5+)" value={isLoading ? "…" : `${kpis.topRated.toFixed(1)}%`} Icon={ShieldCheck} accent="green" />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* Scatter Chart: Rating vs Review Count */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand-core" />
              Vendor Health Matrix
            </h3>
            <p className="text-sm text-neutral-500 mb-4">Compare vendor rating vs. total order volume (reviews).</p>
            <div className="h-[300px] w-full">
              {isLoading ? (
                <div className="h-full w-full flex items-center justify-center text-neutral-400">Loading chart...</div>
              ) : chartData.length === 0 ? (
                <div className="h-full w-full flex items-center justify-center text-neutral-400">No rating data yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis type="number" dataKey="reviews" name="Reviews" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis type="number" dataKey="rating" name="Rating" domain={[1, 5]} stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <ZAxis type="category" dataKey="name" name="Vendor" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Scatter name="Vendors" data={chartData} fill="#008751" fillOpacity={0.6} />
                  </ScatterChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-0 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="font-semibold text-lg">Top Performing Vendors</h3>
            </div>
            <UberTable>
              <UberThead>
                <tr>
                  <UberTh>Vendor</UberTh>
                  <UberTh>Rating</UberTh>
                  <UberTh>Reviews</UberTh>
                </tr>
              </UberThead>
              <tbody>
                {isLoading ? (
                  <UberTr><UberTd colSpan={3} className="text-center py-4">Loading...</UberTd></UberTr>
                ) : chartData.length === 0 ? (
                  <UberTr><UberTd colSpan={3} className="text-center py-4">No data</UberTd></UberTr>
                ) : (
                  chartData.sort((a,b) => b.rating - a.rating).slice(0, 5).map((v, i) => (
                    <UberTr key={i}>
                      <UberTd className="font-medium">{v.name}</UberTd>
                      <UberTd className="flex items-center gap-1"><Star className="h-3 w-3 fill-orange-400 text-orange-400" /> {v.rating.toFixed(1)}</UberTd>
                      <UberTd className="text-neutral-500">{v.reviews}</UberTd>
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
