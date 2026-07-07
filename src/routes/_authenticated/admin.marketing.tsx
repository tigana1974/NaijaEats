// @ts-nocheck
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
import { Send, Mail, MessageCircle, PieChart, Plus, Users, Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";

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
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["admin-marketing-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_campaigns")
        .select(`*`)
        .order('scheduled_for', { ascending: false });
      
      if (error) throw error;
      return (data as any) as Campaign[];
    },
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
              <button className="flex items-center gap-2 rounded-full bg-brand-clay px-4 py-2 text-sm font-semibold text-brand-cream hover:bg-neutral-800">
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
                    <UberTr key={camp.id}>
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
                          <button className="p-2 hover:bg-neutral-100 rounded-md text-neutral-500" title="View Report">
                            <ArrowRight className="h-4 w-4" />
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
    </AdminShell>
  );
}
