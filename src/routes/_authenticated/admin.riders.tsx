import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  PageHeader,
  PageBody,
  KpiCard,
  Card,
  FilterBar,
  StatusBadge,
  TableWrap,
  Thead,
  Th,
  Tr,
  Td,
  EmptyState,
  btn,
} from "@/components/admin/AdminUI";
import { Bike, CheckCircle2, Clock, MoreHorizontal } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/riders")({
  component: AdminRiders,
});

function AdminRiders() {
  const [search, setSearch] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-riders"],
    staleTime: 30_000,
    queryFn: async () => {
      // riders live in user_roles as role=rider; join with profiles for display
      const { data: rls } = await supabase.from("user_roles").select("user_id").eq("role", "rider");
      const ids = (rls ?? []).map((r: any) => r.user_id);
      if (ids.length === 0) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,full_name,email,phone,created_at")
        .in("id", ids);
      return profiles ?? [];
    },
  });

  const filtered = useMemo(() => {
    const list = data ?? [];
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter((r: any) =>
      [r.full_name, r.email, r.phone].filter(Boolean).some((v: string) => v.toLowerCase().includes(q))
    );
  }, [data, search]);

  const stats = useMemo(() => {
    const list = data ?? [];
    return { total: list.length, active: list.length, pending: 0 };
  }, [data]);

  return (
    <AdminShell>
      <PageHeader
        title="Riders"
        description="Manage delivery riders, verify documents, and track availability."
        actions={
          <>
            <button className={btn.secondary}>Assignment rules</button>
            <button className={btn.primary}>Invite rider</button>
          </>
        }
      />
      <PageBody>
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard label="Total riders" value={stats.total} Icon={Bike} accent="green" />
          <KpiCard label="Currently active" value={stats.active} Icon={CheckCircle2} accent="green" />
          <KpiCard label="Awaiting verification" value={stats.pending} Icon={Clock} accent="orange" />
        </div>

        <div className="mt-6">
          <Card>
            <div className="p-4">
              <FilterBar onSearch={setSearch} filters={[{ label: "City" }, { label: "Availability" }]} />
              {isLoading ? (
                <div className="p-6 text-sm text-muted-foreground">Loading riders…</div>
              ) : filtered.length === 0 ? (
                <EmptyState
                  title="No riders yet"
                  description="Once riders are onboarded and approved they will appear here."
                />
              ) : (
                <TableWrap>
                  <Thead>
                    <tr>
                      <Th>Rider</Th>
                      <Th>Contact</Th>
                      <Th>Status</Th>
                      <Th>Joined</Th>
                      <Th className="text-right">Actions</Th>
                    </tr>
                  </Thead>
                  <tbody>
                    {filtered.map((r: any) => (
                      <Tr key={r.id}>
                        <Td className="font-medium">{r.full_name || "Rider"}</Td>
                        <Td className="text-muted-foreground">
                          <div>{r.email}</div>
                          {r.phone && <div className="text-xs">{r.phone}</div>}
                        </Td>
                        <Td>
                          <StatusBadge status="active" />
                        </Td>
                        <Td className="text-muted-foreground">
                          {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
                        </Td>
                        <Td className="text-right">
                          <button className="rounded-md p-1.5 hover:bg-muted">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </TableWrap>
              )}
            </div>
          </Card>
        </div>
      </PageBody>
    </AdminShell>
  );
}
