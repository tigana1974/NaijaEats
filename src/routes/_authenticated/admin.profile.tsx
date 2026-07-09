import React, { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { UberPageTitle, uberBtn } from "@/components/admin/AdminUI";
import { LogOut, User, Mail, Phone, Save } from "lucide-react";
import { clearAllLocalUsernames } from "@/lib/username";

export const Route = createFileRoute("/_authenticated/admin/profile")({
  component: AdminProfile,
});

function AdminProfile() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["admin-profile-full"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("No user");

      const { data: p, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error; // ignore no rows

      const { data: r } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", u.user.id)
        .eq("role", "admin")
        .maybeSingle();

      return {
        id: u.user.id,
        email: u.user.email,
        full_name: p?.full_name || "",
        phone: p?.phone || "",
        is_master_admin: (r as any)?.is_master_admin === true,
      };
    },
  });

  const { data: invites } = useQuery({
    queryKey: ["admin-invites"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_invites" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!profile?.is_master_admin,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { full_name: string; phone: string }) => {
      if (!profile?.id) throw new Error("Missing user ID");
      
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: profile.id,
          full_name: data.full_name,
          phone: data.phone,
          updated_at: new Date().toISOString(),
        });
        
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
      qc.invalidateQueries({ queryKey: ["admin-profile-full"] });
      qc.invalidateQueries({ queryKey: ["me-admin-header"] });
    },
    onError: (err: any) => {
      toast.error(`Update failed: ${err.message}`);
    },
  });

  const handleLogOut = async () => {
    try {
      clearAllLocalUsernames();
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate({ to: "/" });
    } catch (e: any) {
      toast.error(`Logout failed: ${e.message}`);
    }
  };

  const inviteMutation = useMutation({
    mutationFn: async (email: string) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("user_invites" as any).insert({ 
        email, 
        role: "admin", 
        invited_by: u.user?.id 
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Admin invited successfully!");
      qc.invalidateQueries({ queryKey: ["admin-invites"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteInviteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_invites" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Invite revoked");
      qc.invalidateQueries({ queryKey: ["admin-invites"] });
    },
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    updateMutation.mutate({
      full_name: fd.get("full_name") as string,
      phone: fd.get("phone") as string,
    });
  };

  const onInvite = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = fd.get("email") as string;
    if (email) {
      inviteMutation.mutate(email);
      e.currentTarget.reset();
    }
  };

  return (
    <AdminShell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          title="Admin Profile"
          description="Manage your personal details and account settings."
          actions={
            <button 
              type="button" 
              onClick={handleLogOut} 
              className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          }
        />

        <div className="mt-8">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-neutral-500">
              Loading profile...
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
              <div className="border-b border-border bg-muted/20 px-6 py-4">
                <h3 className="font-medium">Personal Information</h3>
                <p className="text-sm text-neutral-500 mt-1">
                  Update your contact details and how you appear in the dashboard.
                </p>
              </div>
              
              <form onSubmit={onSubmit} className="px-6 py-6 space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4 text-neutral-400" /> Full Name
                    </label>
                    <input 
                      required 
                      name="full_name" 
                      defaultValue={profile?.full_name}
                      className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
                      placeholder="e.g. John Doe" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4 text-neutral-400" /> Phone Number
                    </label>
                    <input 
                      name="phone" 
                      defaultValue={profile?.phone}
                      className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
                      placeholder="+234..." 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-neutral-400" /> Email Address
                  </label>
                  <input 
                    readOnly 
                    disabled 
                    value={profile?.email || ""}
                    className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground shadow-sm opacity-70 cursor-not-allowed" 
                  />
                  <p className="text-xs text-neutral-500">Email address cannot be changed from this panel.</p>
                </div>

                <div className="pt-4 border-t flex justify-end">
                  <button 
                    type="submit" 
                    disabled={updateMutation.isPending} 
                    className={uberBtn.primary}
                  >
                    {updateMutation.isPending ? (
                      "Saving..."
                    ) : (
                      <>
                        <Save className="h-4 w-4" /> Save changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {profile?.is_master_admin && (
            <div className="mt-8 rounded-xl border border-border bg-white shadow-sm overflow-hidden">
              <div className="border-b border-border bg-muted/20 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-[var(--naija-orange)]" /> Master Admin Panel
                  </h3>
                  <p className="text-sm text-neutral-500 mt-1">
                    Invite other administrators to the platform.
                  </p>
                </div>
                <span className="rounded-full bg-[var(--naija-orange)]/10 px-2 py-1 text-xs font-semibold text-[var(--naija-orange)]">
                  Master Privileges
                </span>
              </div>
              
              <div className="px-6 py-6">
                <form onSubmit={onInvite} className="flex gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium">New Admin Email</label>
                    <input 
                      required 
                      type="email"
                      name="email" 
                      className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--naija-green)]" 
                      placeholder="colleague@naijaeats.com" 
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={inviteMutation.isPending} 
                    className={uberBtn.primary}
                  >
                    {inviteMutation.isPending ? "Inviting..." : "Send Invite"}
                  </button>
                </form>

                <div className="mt-8">
                  <h4 className="text-sm font-medium text-neutral-700 mb-3">Pending Admin Invites</h4>
                  {invites?.length === 0 ? (
                    <p className="text-sm text-neutral-500 italic">No pending invites.</p>
                  ) : (
                    <div className="rounded-md border border-border overflow-hidden">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 border-b border-border text-xs uppercase text-neutral-500">
                          <tr>
                            <th className="px-4 py-2 font-medium">Email</th>
                            <th className="px-4 py-2 font-medium">Role</th>
                            <th className="px-4 py-2 font-medium">Date Sent</th>
                            <th className="px-4 py-2 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {invites?.map((inv: any) => (
                            <tr key={inv.id} className="hover:bg-muted/20">
                              <td className="px-4 py-3 font-medium">{inv.email}</td>
                              <td className="px-4 py-3 capitalize">{inv.role}</td>
                              <td className="px-4 py-3 text-neutral-500">
                                {new Date(inv.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => deleteInviteMutation.mutate(inv.id)}
                                  className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
                                >
                                  Revoke
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
