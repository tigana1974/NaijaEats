import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageHeader, PageBody, Card, CardHeader, TableWrap, Thead, Th, Tr, Td } from "@/components/admin/AdminUI";
import { Star, StarOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/store-groups")({
  component: AdminStoreGroups,
});

function AdminStoreGroups() {
  const qc = useQueryClient();

  const { data: vendors, isLoading } = useQuery({
    queryKey: ["admin-store-groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("id,name,type,city,country,is_featured")
        .order("is_featured", { ascending: false })
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const toggleFeatured = useMutation({
    mutationFn: async ({ id, is_featured }: { id: string, is_featured: boolean }) => {
      const { error } = await supabase.from("vendors").update({ is_featured }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Store group updated");
      qc.invalidateQueries({ queryKey: ["admin-store-groups"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to update store"),
  });

  const featured = vendors?.filter(v => v.is_featured) || [];
  const notFeatured = vendors?.filter(v => !v.is_featured) || [];

  return (
    <AdminShell>
      <PageHeader
        title="Store Groups (Featured)"
        description="Manage which stores appear in the featured sections on the homepage."
        breadcrumb={["Admin", "Stores", "Store Groups"]}
      />
      <PageBody>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Featured Stores */}
          <Card>
            <CardHeader title={`Featured Stores (${featured.length})`} description="Currently active in featured lists." />
            {featured.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No featured stores yet.</div>
            ) : (
              <TableWrap>
                <Thead>
                  <tr>
                    <Th>Store</Th>
                    <Th>Location</Th>
                    <Th></Th>
                  </tr>
                </Thead>
                <tbody>
                  {featured.map((v) => (
                    <Tr key={v.id}>
                      <Td>
                        <div className="font-medium text-sm">{v.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{v.type}</div>
                      </Td>
                      <Td className="text-sm text-neutral-600">{[v.city, v.country].filter(Boolean).join(", ") || "—"}</Td>
                      <Td className="text-right">
                        <button
                          onClick={() => toggleFeatured.mutate({ id: v.id, is_featured: false })}
                          className="rounded-full p-2 text-rose-500 hover:bg-rose-50"
                          title="Remove from featured"
                        >
                          <StarOff className="h-4 w-4" />
                        </button>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </TableWrap>
            )}
          </Card>

          {/* All Other Stores */}
          <Card>
            <CardHeader title={`Available Stores (${notFeatured.length})`} description="Click the star to add to featured." />
            <TableWrap>
              <Thead>
                <tr>
                  <Th>Store</Th>
                  <Th>Location</Th>
                  <Th></Th>
                </tr>
              </Thead>
              <tbody>
                {isLoading ? (
                  <Tr><td colSpan={3} className="text-center py-8">Loading...</td></Tr>
                ) : (
                  notFeatured.map((v) => (
                    <Tr key={v.id}>
                      <Td>
                        <div className="font-medium text-sm">{v.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{v.type}</div>
                      </Td>
                      <Td className="text-sm text-neutral-600">{[v.city, v.country].filter(Boolean).join(", ") || "—"}</Td>
                      <Td className="text-right">
                        <button
                          onClick={() => toggleFeatured.mutate({ id: v.id, is_featured: true })}
                          className="rounded-full p-2 text-amber-500 hover:bg-amber-50"
                          title="Add to featured"
                        >
                          <Star className="h-4 w-4" />
                        </button>
                      </Td>
                    </Tr>
                  ))
                )}
              </tbody>
            </TableWrap>
          </Card>
        </div>
      </PageBody>
    </AdminShell>
  );
}
