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
  uberBtn,
} from "@/components/admin/AdminUI";
import { MoreHorizontal, Plus, Shield, Users, UserCog } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

const AVAILABLE_ROLES = ["admin", "vendor", "rider", "customer"];

function AdminUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const inviteMutation = useMutation({
    mutationFn: async (formData: any) => {
      // Simulate edge function call to invite user
      await new Promise(r => setTimeout(r, 1000));
      console.log("Invited user:", formData);
    },
    onSuccess: () => {
      toast.success("User invited successfully");
      setIsInviteOpen(false);
    },
    onError: (err: any) => {
      toast.error(`Failed to invite user: ${err.message}`);
    }
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users-full"],
    staleTime: 30_000,
    queryFn: async () => {
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("id,full_name,email,phone,avatar_url,created_at"),
        supabase.from("user_roles").select("user_id,role"),
      ]);
      const profiles = profilesRes.data ?? [];
      const roles = rolesRes.data ?? [];
      
      const rolesByUser = new Map<string, string[]>();
      for (const r of roles) {
        if (!rolesByUser.has(r.user_id)) rolesByUser.set(r.user_id, []);
        rolesByUser.get(r.user_id)!.push(r.role);
      }

      return profiles.map(p => ({
        ...p,
        roles: rolesByUser.get(p.id) || ["customer"], // everyone is basically a customer implicitly
      })).sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    },
  });

  const toggleRole = useMutation({
    mutationFn: async ({ userId, role, isAdding }: { userId: string, role: string, isAdding: boolean }) => {
      if (isAdding) {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").delete().match({ user_id: userId, role });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Roles updated");
      queryClient.invalidateQueries({ queryKey: ["admin-users-full"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update role");
    }
  });

  const list = data ?? [];

  const filtered = useMemo(() => {
    if (!search) return list;
    const s = search.toLowerCase();
    return list.filter((r) =>
      [r.full_name, r.email, r.phone].filter(Boolean).some((v) => (v as string).toLowerCase().includes(s)),
    );
  }, [list, search]);

  const kpis = useMemo(() => {
    return {
      total: list.length,
      admins: list.filter(u => u.roles.includes("admin")).length,
      vendors: list.filter(u => u.roles.includes("vendor")).length,
      riders: list.filter(u => u.roles.includes("rider")).length,
    };
  }, [list]);

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Access"
          title="Users & Roles"
          description="Manage system access across all NaijaEats platforms."
          actions={
            <button type="button" className={uberBtn.primary} onClick={() => setIsInviteOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Invite user
            </button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UberKpi label="Total Users" value={isLoading ? "…" : kpis.total} hint="Registered accounts" />
          <UberKpi label="Admins" value={isLoading ? "…" : kpis.admins} Icon={Shield} />
          <UberKpi label="Vendors" value={isLoading ? "…" : kpis.vendors} Icon={Users} />
          <UberKpi label="Riders" value={isLoading ? "…" : kpis.riders} Icon={UserCog} />
        </div>

        <div className="mt-8">
          <UberFilterBar
            search={search}
            onSearch={setSearch}
            filters={[{ label: "Role" }, { label: "Status" }]}
            onExport={() => {}}
          />

          <UberTable>
            <UberThead>
              <tr>
                <UberTh>User</UberTh>
                <UberTh>Contact</UberTh>
                <UberTh>Roles</UberTh>
                <UberTh>Joined</UberTh>
                <UberTh className="w-[1%]" />
              </tr>
            </UberThead>
            <tbody>
              {isLoading ? (
                <UberTr>
                  <UberTd colSpan={10} className="py-8 text-center text-neutral-500">Loading users…</UberTd>
                </UberTr>
              ) : filtered.length === 0 ? (
                <UberTr>
                  <UberTd colSpan={10} className="py-8 text-center text-neutral-500">No users found.</UberTd>
                </UberTr>
              ) : (
                filtered.map((u) => (
                  <UberTr key={u.id}>
                    <UberTd>
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-neutral-600 text-xs font-medium">
                          {initials(u.full_name || u.email)}
                        </div>
                        <div>
                          <div className="font-medium text-[oklch(0.18_0.006_260)]">{u.full_name || "Unnamed"}</div>
                          <div className="font-mono text-[11px] text-neutral-500">#{String(u.id).slice(0, 8)}</div>
                        </div>
                      </div>
                    </UberTd>
                    <UberTd className="text-neutral-600">
                      <div className="truncate">{u.email || "—"}</div>
                      <div className="text-[12px] text-neutral-500">{u.phone || ""}</div>
                    </UberTd>
                    <UberTd>
                      {editingUserId === u.id ? (
                        <div className="flex flex-wrap gap-2">
                          {AVAILABLE_ROLES.map(role => (
                            <label key={role} className="flex items-center gap-1.5 text-xs font-medium">
                              <input 
                                type="checkbox" 
                                checked={u.roles.includes(role)}
                                disabled={role === "customer" || toggleRole.isPending}
                                onChange={(e) => toggleRole.mutate({ userId: u.id, role, isAdding: e.target.checked })}
                              />
                              <span className="capitalize">{role}</span>
                            </label>
                          ))}
                          <button 
                            onClick={() => setEditingUserId(null)}
                            className="ml-2 text-xs text-brand-core underline"
                          >
                            Done
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map(r => (
                            <span key={r} className="inline-flex items-center rounded-sm bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </UberTd>
                    <UberTd className="text-neutral-500">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                    </UberTd>
                    <UberTd>
                      <button 
                        onClick={() => setEditingUserId(u.id)}
                        className="rounded-full p-1.5 hover:bg-[oklch(0.965_0.003_260)]"
                      >
                        <MoreHorizontal className="h-4 w-4 text-neutral-500" />
                      </button>
                    </UberTd>
                  </UberTr>
                ))
              )}
            </tbody>
          </UberTable>
        </div>
      </div>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>
              Send an invitation to join the platform with specific role permissions.
            </DialogDescription>
          </DialogHeader>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              inviteMutation.mutate(Object.fromEntries(fd));
            }}
            className="grid gap-4 py-4"
          >
            <div className="grid gap-2">
              <label className="text-sm font-medium">Full Name</label>
              <input required name="name" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="e.g. John Doe" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Email address</label>
              <input required type="email" name="email" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="john@example.com" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Role</label>
              <select name="role" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="admin">Administrator (Full Access)</option>
                <option value="vendor">Vendor / Partner</option>
                <option value="rider">Delivery Rider</option>
                <option value="customer">Customer</option>
              </select>
            </div>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <button type="button" className={uberBtn.secondary}>Cancel</button>
              </DialogClose>
              <button type="submit" disabled={inviteMutation.isPending} className={uberBtn.primary}>
                {inviteMutation.isPending ? "Sending..." : "Send Invite"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}
