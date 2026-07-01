import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageHeader, PageBody, Card, CardHeader, TableWrap, Thead, Th, Tr, Td } from "@/components/admin/AdminUI";
import { Globe, Link2, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/webshop")({
  component: AdminWebshop,
});

function AdminWebshop() {
  const { data: vendors, isLoading } = useQuery({
    queryKey: ["admin-webshops"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("id,name,type,slug,status")
        .eq("status", "approved")
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/vendor/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  return (
    <AdminShell>
      <PageHeader
        title="Webshops"
        description="Public online storefronts for approved vendors."
        breadcrumb={["Admin", "Stores", "Webshops"]}
      />
      <PageBody>
        <Card>
          <CardHeader title="Live Storefronts" description="Public URLs for your approved vendors." />
          <TableWrap>
            <Thead>
              <tr>
                <Th>Vendor</Th>
                <Th>Type</Th>
                <Th>Public Link</Th>
                <Th></Th>
              </tr>
            </Thead>
            <tbody>
              {isLoading ? (
                <Tr><td colSpan={4} className="text-center py-8">Loading...</td></Tr>
              ) : vendors?.length === 0 ? (
                <Tr><td colSpan={4} className="text-center py-8">No approved vendors found.</td></Tr>
              ) : (
                vendors?.map((v) => (
                  <Tr key={v.id}>
                    <Td>
                      <div className="font-medium text-sm">{v.name}</div>
                      <div className="text-xs text-muted-foreground">@{v.slug}</div>
                    </Td>
                    <Td className="capitalize text-sm">{v.type}</Td>
                    <Td className="text-sm font-mono text-muted-foreground">
                      /vendor/{v.slug}
                    </Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => copyLink(v.slug)}
                          className="rounded p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                          title="Copy Link"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <a
                          href={`/vendor/${v.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-[var(--naija-green)]"
                          title="Open in new tab"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </Td>
                  </Tr>
                ))
              )}
            </tbody>
          </TableWrap>
        </Card>
      </PageBody>
    </AdminShell>
  );
}
