import React, { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { UberPageTitle, uberBtn } from "@/components/admin/AdminUI";
import { LogOut, User, Mail, Phone, Save } from "lucide-react";

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

      return {
        id: u.user.id,
        email: u.user.email,
        full_name: p?.full_name || "",
        phone: p?.phone || "",
      };
    },
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
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate({ to: "/" });
    } catch (e: any) {
      toast.error(`Logout failed: ${e.message}`);
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    updateMutation.mutate({
      full_name: fd.get("full_name") as string,
      phone: fd.get("phone") as string,
    });
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
        </div>
      </div>
    </AdminShell>
  );
}
