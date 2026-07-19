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
  formatMoney
} from "@/components/admin/AdminUI";
import { HandCoins, Gauge, TrendingUp, FileText, CheckCircle, XCircle, Plus } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/admin/financing")({
  component: AdminFinancing,
});

type Loan = {
  id: string;
  vendor_id: string;
  status: string;
  principal_amount: number;
  interest_rate: number;
  repaid_amount: number;
  daily_deduction_rate: number;
  created_at: string;
  vendors?: { name: string };
};

function AdminFinancing() {
  const qc = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: loans, isLoading } = useQuery({
    queryKey: ["admin-financing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_financing")
        .select(`
          *,
          vendors (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as any) as Loan[];
    },
  });

  const { data: vendorOptions } = useQuery({
    queryKey: ["admin-financing-vendor-options"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("id,name,currency")
        .eq("status", "approved")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const decide = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("vendor_financing")
        .update(
          approve
            ? { status: "active", approved_at: new Date().toISOString(), approved_by: u.user?.id ?? null }
            : { status: "rejected" },
        )
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.approve ? "Advance approved — repayments start on the next payout cycle" : "Application rejected");
      qc.invalidateQueries({ queryKey: ["admin-financing"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to update application"),
  });

  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      const vendor = (vendorOptions ?? []).find((v: any) => v.id === formData.vendor_id);
      const { error } = await supabase.from("vendor_financing").insert({
        vendor_id: formData.vendor_id,
        status: "pending",
        principal_amount: Number(formData.principal_amount),
        interest_rate: Number(formData.interest_rate || 5),
        daily_deduction_rate: Number(formData.daily_deduction_rate || 10),
        currency: vendor?.currency || "NGN",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Financing application recorded (pending approval)");
      setIsCreateOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-financing"] });
    },
    onError: (err: any) => toast.error(`Failed to create application: ${err.message}`),
  });

  const kpis = {
    active: loans?.filter(l => l.status === 'active').length || 0,
    pending: loans?.filter(l => l.status === 'pending').length || 0,
    totalDisbursed: loans?.filter(l => l.status === 'active' || l.status === 'repaid').reduce((sum, l) => sum + Number(l.principal_amount), 0) || 0,
    totalRepaid: loans?.reduce((sum, l) => sum + Number(l.repaid_amount), 0) || 0,
  };

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Finance"
          title="Vendor Financing"
          description="Manage cash advances, loans, and automated sales deductions."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-8">
          <UberKpi label="Active Advances" value={isLoading ? "…" : kpis.active} Icon={HandCoins} accent="blue" />
          <UberKpi label="Pending Applications" value={isLoading ? "…" : kpis.pending} Icon={FileText} accent="orange" />
          <UberKpi label="Total Disbursed" value={isLoading ? "…" : formatMoney(kpis.totalDisbursed, "NGN")} Icon={TrendingUp} accent="green" />
          <UberKpi label="Total Repaid" value={isLoading ? "…" : formatMoney(kpis.totalRepaid, "NGN")} Icon={Gauge} accent="ink" />
        </div>

        <div className="mt-8">
          <div className="rounded-xl border border-border bg-card p-0 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-border p-5 bg-neutral-50/50">
              <h3 className="font-semibold text-lg">Financing Applications & Active Loans</h3>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-2 rounded-full bg-brand-clay px-4 py-2 text-sm font-semibold text-brand-cream hover:bg-neutral-800"
              >
                <Plus className="h-4 w-4" />
                New Advance
              </button>
            </div>
            
            <UberTable>
              <UberThead>
                <tr>
                  <UberTh>Vendor</UberTh>
                  <UberTh>Date Applied</UberTh>
                  <UberTh>Status</UberTh>
                  <UberTh>Principal</UberTh>
                  <UberTh>Terms</UberTh>
                  <UberTh>Progress</UberTh>
                  <UberTh></UberTh>
                </tr>
              </UberThead>
              <tbody>
                {isLoading ? (
                  <UberTr><UberTd colSpan={7} className="text-center py-8">Loading records...</UberTd></UberTr>
                ) : !loans || loans.length === 0 ? (
                  <UberTr>
                    <UberTd colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center text-neutral-400">
                        <HandCoins className="h-12 w-12 mb-3 text-neutral-300" />
                        <p className="text-base font-medium text-neutral-900">No financing records</p>
                        <p className="text-sm mt-1">Vendors can request cash advances based on their sales history.</p>
                      </div>
                    </UberTd>
                  </UberTr>
                ) : (
                  loans.map((loan) => {
                    const totalRepayable = loan.principal_amount * (1 + (loan.interest_rate / 100));
                    const progress = totalRepayable > 0 ? (loan.repaid_amount / totalRepayable) * 100 : 0;
                    
                    return (
                      <UberTr key={loan.id}>
                        <UberTd className="font-medium text-neutral-900">{loan.vendors?.name || 'Unknown'}</UberTd>
                        <UberTd>
                          <span className="text-sm">{format(new Date(loan.created_at), "MMM d, yyyy")}</span>
                        </UberTd>
                        <UberTd>
                          <UberStatus 
                            status={loan.status} 
                            variant={loan.status === 'active' ? 'success' : loan.status === 'pending' ? 'warning' : loan.status === 'repaid' ? 'neutral' : 'error'}
                          />
                        </UberTd>
                        <UberTd className="font-medium">{formatMoney(loan.principal_amount, "NGN")}</UberTd>
                        <UberTd>
                          <div className="flex flex-col">
                            <span className="text-sm">{loan.interest_rate}% Interest</span>
                            <span className="text-xs text-neutral-500">{loan.daily_deduction_rate}% daily deduction</span>
                          </div>
                        </UberTd>
                        <UberTd>
                          {loan.status === 'active' || loan.status === 'repaid' ? (
                            <div className="w-full max-w-[150px]">
                              <div className="flex justify-between text-xs mb-1">
                                <span>{formatMoney(loan.repaid_amount, "NGN")}</span>
                                <span className="text-neutral-500">{formatMoney(totalRepayable, "NGN")}</span>
                              </div>
                              <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500" style={{ width: `${Math.min(100, progress)}%` }}></div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-neutral-500">—</span>
                          )}
                        </UberTd>
                        <UberTd>
                          <div className="flex items-center gap-2 justify-end">
                            {loan.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => decide.mutate({ id: loan.id, approve: false })}
                                  disabled={decide.isPending}
                                  className="p-1.5 hover:bg-red-50 text-red-600 rounded-md"
                                  title="Reject"
                                >
                                  <XCircle className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => decide.mutate({ id: loan.id, approve: true })}
                                  disabled={decide.isPending}
                                  className="p-1.5 hover:bg-green-50 text-green-600 rounded-md"
                                  title="Approve"
                                >
                                  <CheckCircle className="h-5 w-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </UberTd>
                      </UberTr>
                    );
                  })
                )}
              </tbody>
            </UberTable>
          </div>
        </div>
      </div>

      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto w-full">
          <SheetHeader>
            <SheetTitle>New Cash Advance</SheetTitle>
            <SheetDescription>
              Record a financing application for a vendor. Approve it from the list to activate repayments.
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
              <label className="text-sm font-medium">Vendor</label>
              <select required name="vendor_id" defaultValue="" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="" disabled>Select a vendor…</option>
                {(vendorOptions ?? []).map((v: any) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Principal Amount</label>
              <input required name="principal_amount" type="number" min="1" step="0.01" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="e.g. 250000" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Interest Rate (%)</label>
                <input name="interest_rate" type="number" min="0" step="0.1" defaultValue="5" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Daily Deduction (%)</label>
                <input name="daily_deduction_rate" type="number" min="0" max="100" step="0.1" defaultValue="10" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
            </div>

            <SheetFooter className="mt-8 pt-4 border-t">
              <SheetClose asChild>
                <button type="button" className={uberBtn.secondary}>Cancel</button>
              </SheetClose>
              <button type="submit" disabled={createMutation.isPending} className={uberBtn.primary}>
                {createMutation.isPending ? "Saving..." : "Record Application"}
              </button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </AdminShell>
  );
}
