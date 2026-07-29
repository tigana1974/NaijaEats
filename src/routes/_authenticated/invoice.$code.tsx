import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";

import { PayableInvoiceCard } from "@/components/naija/PayableInvoiceCard";
import { RoleShell } from "@/components/naija/RoleShell";
import { formatInvoiceAmount, lookupChatInvoice, payChatInvoice } from "@/lib/chatInvoices";

export const Route = createFileRoute("/_authenticated/invoice/$code")({
  component: SharedInvoicePage,
});

function SharedInvoicePage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [paying, setPaying] = useState(false);

  const {
    data: invoice,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["shared-chat-invoice", code],
    queryFn: () => lookupChatInvoice(code),
    retry: false,
  });

  const pay = async () => {
    if (!invoice) return;
    setPaying(true);
    try {
      await payChatInvoice(code);
      await queryClient.invalidateQueries({ queryKey: ["shared-chat-invoice", code] });
      toast.success(`${formatInvoiceAmount(invoice.amount, invoice.currency)} payment confirmed`);
    } catch (payError) {
      const message =
        payError instanceof Error ? payError.message : "Could not complete the payment";
      toast.error(message);
      if (/insufficient wallet balance/i.test(message)) navigate({ to: "/wallet/top-up" });
    } finally {
      setPaying(false);
    }
  };

  return (
    <RoleShell hideBottomNav>
      <div className="mx-auto max-w-md px-4 py-8 sm:px-6">
        <Link
          to="/wallet"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Wallet
        </Link>

        <div className="mt-6">
          {isLoading ? (
            <div className="rounded-3xl border border-border bg-white p-8 text-center text-sm text-muted-foreground">
              Loading invoice...
            </div>
          ) : error || !invoice ? (
            <div className="rounded-3xl border border-border bg-white p-8 text-center">
              <h1 className="font-display text-xl font-semibold">Invoice not found</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                This payment code is invalid or no longer available.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[1.5rem] border border-border shadow-xl">
              <PayableInvoiceCard
                invoice={{
                  code: invoice.code,
                  amount: invoice.amount,
                  currency: invoice.currency,
                  note: invoice.note,
                  status: invoice.status,
                  createdAt: invoice.created_at,
                }}
                from={invoice.issuer_name ?? "NaijaEats vendor"}
                to="Invoice recipient"
                paid={invoice.status === "paid"}
                paying={paying}
                canPay={invoice.status === "unpaid"}
                onPay={pay}
              />
            </div>
          )}
        </div>
      </div>
    </RoleShell>
  );
}
