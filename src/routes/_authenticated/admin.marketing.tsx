// @ts-nocheck
import React, { useState } from "react";
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
import { Send, Mail, MessageCircle, PieChart, Plus, Users, Calendar, ChevronDown, Bell } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/admin/marketing")({
  component: AdminMarketing,
});

type Campaign = {
  id: string;
  title: string;
  type: string;
  audience: string;
  status: string;
  subject: string;
  sent_count: number;
  open_count: number;
  click_count: number;
  scheduled_for: string;
};

function AdminMarketing() {
  const qc = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["admin-marketing-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_campaigns")
        .select(`*`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as any) as Campaign[];
    },
  });

  const createDraft = useMutation({
    mutationFn: async (formData: any) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("marketing_campaigns").insert({
        title: formData.title,
        type: formData.type,
        audience: formData.audience,
        status: "draft",
        subject: formData.subject,
        body: formData.body,
        created_by: u.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Campaign saved as draft");
      setIsCreateOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-marketing-campaigns"] });
    },
    onError: (err: any) => toast.error(`Failed to save campaign: ${err.message}`),
  });

  const sendNow = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc("dispatch_campaign", { p_campaign_id: id });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (sent) => {
      toast.success(`Campaign delivered to ${sent} user${sent === 1 ? "" : "s"} as in-app notifications`);
      qc.invalidateQueries({ queryKey: ["admin-marketing-campaigns"] });
    },
    onError: (err: any) => toast.error(`Failed to send: ${err.message}`),
  });

  const kpis = {
    total: campaigns?.length || 0,
    sent: campaigns?.reduce((sum, c) => sum + (c.sent_count || 0), 0) || 0,
    openRate: (() => {
      if (!campaigns || campaigns.length === 0) return 0;
      const sent = campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0);
      const opened = campaigns.reduce((sum, c) => sum + (c.open_count || 0), 0);
      return sent > 0 ? (opened / sent) * 100 : 0;
    })()
  };

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Marketing & Growth"
          title="Campaigns"
          description="Manage push notifications, email blasts, and SMS marketing."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-8">
          <UberKpi label="Total Campaigns" value={isLoading ? "…" : kpis.total} Icon={Send} accent="blue" />
          <UberKpi label="Total Sent (All Time)" value={isLoading ? "…" : kpis.sent.toLocaleString()} Icon={Mail} accent="green" />
          <UberKpi label="Average Open Rate" value={isLoading ? "…" : `${kpis.openRate.toFixed(1)}%`} Icon={PieChart} accent="orange" />
          <UberKpi label="Active Drafts" value={isLoading ? "…" : campaigns?.filter(c => c.status === 'draft').length || 0} Icon={MessageCircle} accent="ink" />
        </div>

        <div className="mt-8">
          <div className="rounded-xl border border-border bg-card p-0 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-border p-5 bg-neutral-50/50">
              <h3 className="font-semibold text-lg">All Campaigns</h3>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-2 rounded-full bg-brand-clay px-4 py-2 text-sm font-semibold text-brand-cream hover:bg-neutral-800"
              >
                <Plus className="h-4 w-4" />
                Draft Campaign
              </button>
            </div>
            
            <UberTable>
              <UberThead>
                <tr>
                  <UberTh>Campaign</UberTh>
                  <UberTh>Channel</UberTh>
                  <UberTh>Audience</UberTh>
                  <UberTh>Status</UberTh>
                  <UberTh>Date</UberTh>
                  <UberTh>Performance</UberTh>
                  <UberTh></UberTh>
                </tr>
              </UberThead>
              <tbody>
                {isLoading ? (
                  <UberTr><UberTd colSpan={7} className="text-center py-8">Loading campaigns...</UberTd></UberTr>
                ) : !campaigns || campaigns.length === 0 ? (
                  <UberTr>
                    <UberTd colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center text-neutral-400">
                        <Send className="h-12 w-12 mb-3 text-neutral-300" />
                        <p className="text-base font-medium text-neutral-900">No campaigns yet</p>
                        <p className="text-sm mt-1">Start engaging your users with email or push notifications.</p>
                      </div>
                    </UberTd>
                  </UberTr>
                ) : (
                  campaigns.map((camp) => (
                    <React.Fragment key={camp.id}>
                    <UberTr>
                      <UberTd>
                        <div className="flex flex-col">
                          <span className="font-medium text-neutral-900">{camp.title}</span>
                          <span className="text-xs text-neutral-500 line-clamp-1 max-w-[250px]">{camp.subject}</span>
                        </div>
                      </UberTd>
                      <UberTd>
                        <span className="inline-flex items-center gap-1.5 capitalize rounded-full bg-neutral-100 px-2 py-1 text-xs font-medium">
                          {camp.type === 'email' && <Mail className="h-3 w-3" />}
                          {camp.type === 'push' && <Send className="h-3 w-3" />}
                          {camp.type === 'sms' && <MessageCircle className="h-3 w-3" />}
                          {camp.type}
                        </span>
                      </UberTd>
                      <UberTd>
                        <div className="flex items-center gap-1.5 text-sm text-neutral-600 capitalize">
                          <Users className="h-3 w-3" />
                          {camp.audience.replace('_', ' ')}
                        </div>
                      </UberTd>
                      <UberTd>
                        <UberStatus 
                          status={camp.status} 
                          variant={camp.status === 'completed' ? 'success' : camp.status === 'active' || camp.status === 'scheduled' ? 'warning' : 'neutral'}
                        />
                      </UberTd>
                      <UberTd>
                        <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                          <Calendar className="h-3 w-3" />
                          {camp.scheduled_for ? format(new Date(camp.scheduled_for), "MMM d, yyyy") : "Unscheduled"}
                        </div>
                      </UberTd>
                      <UberTd>
                        <div className="flex flex-col">
                          <span className="text-sm">{camp.sent_count.toLocaleString()} sent</span>
                          {camp.sent_count > 0 && (
                            <span className="text-xs text-neutral-500">
                              {((camp.open_count / camp.sent_count) * 100).toFixed(1)}% open rate
                            </span>
                          )}
                        </div>
                      </UberTd>
                      <UberTd>
                        <div className="flex items-center gap-2 justify-end">
                          {(camp.status === "draft" || camp.status === "scheduled") && (
                            <button
                              onClick={() => sendNow.mutate(camp.id)}
                              disabled={sendNow.isPending}
                              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-900 px-3 py-1 text-xs font-medium hover:bg-neutral-100 disabled:opacity-50"
                              title="Deliver now as in-app notifications"
                            >
                              <Bell className="h-3.5 w-3.5" /> Send now
                            </button>
                          )}
                          <button
                            onClick={() => setExpandedId(expandedId === camp.id ? null : camp.id)}
                            className="p-2 hover:bg-neutral-100 rounded-md text-neutral-500"
                            title="View Report"
                          >
                            <ChevronDown className={`h-4 w-4 transition-transform ${expandedId === camp.id ? "rotate-180" : ""}`} />
                          </button>
                        </div>
                      </UberTd>
                    </UberTr>
                    {expandedId === camp.id && (
                      <tr className="border-t border-border bg-neutral-50/60">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="grid gap-4 sm:grid-cols-3 text-sm">
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Message</div>
                              <div className="font-medium">{camp.subject || "—"}</div>
                              <div className="mt-1 whitespace-pre-wrap text-neutral-600">{(camp as any).body || "No body"}</div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Delivery</div>
                              <div className="text-neutral-700">{camp.sent_count.toLocaleString()} sent</div>
                              <div className="text-neutral-700">{camp.open_count.toLocaleString()} opened ({camp.sent_count > 0 ? ((camp.open_count / camp.sent_count) * 100).toFixed(1) : "0.0"}%)</div>
                              <div className="text-neutral-700">{camp.click_count.toLocaleString()} clicked</div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Details</div>
                              <div className="capitalize text-neutral-700">Channel: {camp.type.replace("_", "-")}</div>
                              <div className="capitalize text-neutral-700">Audience: {camp.audience.replace("_", " ")}</div>
                              <div className="text-neutral-700">
                                {camp.scheduled_for ? `Sent ${format(new Date(camp.scheduled_for), "MMM d, yyyy HH:mm")}` : "Not sent yet"}
                              </div>
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
      </div>

      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto w-full">
          <SheetHeader>
            <SheetTitle>Draft Campaign</SheetTitle>
            <SheetDescription>
              Saved as a draft — use "Send now" to deliver it as in-app notifications. Email and SMS channels are recorded but need a provider integration to deliver.
            </SheetDescription>
          </SheetHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              createDraft.mutate(Object.fromEntries(fd));
            }}
            className="mt-6 space-y-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">Campaign Title (Internal)</label>
              <input required name="title" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="e.g. Weekend Jollof Push" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Subject / Headline</label>
              <input required name="subject" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Get 10% off your next meal!" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Channel</label>
                <select name="type" defaultValue="in_app" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="in_app">In-app notification</option>
                  <option value="push">Push</option>
                  <option value="email">Email (draft only)</option>
                  <option value="sms">SMS (draft only)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Audience</label>
                <select name="audience" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="all">All Customers</option>
                  <option value="high_spenders">High Spenders (Top 20%)</option>
                  <option value="churned">Churned (No orders in 30 days)</option>
                  <option value="new">New (Joined last 7 days)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Message Body</label>
              <textarea
                required
                name="body"
                rows={6}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                placeholder="Write your campaign message here..."
              />
            </div>

            <SheetFooter className="mt-8 pt-4 border-t">
              <SheetClose asChild>
                <button type="button" className={uberBtn.secondary}>Cancel</button>
              </SheetClose>
              <button type="submit" disabled={createDraft.isPending} className={uberBtn.primary}>
                {createDraft.isPending ? "Saving..." : "Save Draft"}
              </button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </AdminShell>
  );
}
