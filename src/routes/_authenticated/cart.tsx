import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Trash2, ShoppingCart, MapPin, StickyNote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { initiatePayment } from "@/lib/api/payments.functions";
import { CustomerShell } from "@/components/naija/CustomerShell";
import { QuantityStepper } from "@/components/naija/customer-ui";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/cart")({
  component: CartPage,
});

function CartPage() {
  const navigate = useNavigate();
  const initiatePaymentFn = useServerFn(initiatePayment);
  const { cart, setQuantity, removeItem, clearCart, itemCount, subtotal } = useCart();
  const [address, setAddress] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("custom");
  const [note, setNote] = useState("");
  const [placing, setPlacing] = useState(false);

  const { data: addresses } = useQuery({
    queryKey: ["my-addresses-for-checkout"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .order("is_default", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const fmt = (n: number) => `${cart?.currency === "GBP" ? "£" : "₦"}${Number(n).toLocaleString()}`;

  const formatAddress = (a: any) => [a.line1, a.line2, a.city, a.postcode].filter(Boolean).join(", ");

  const resolvedAddress =
    selectedAddressId === "custom"
      ? address.trim()
      : formatAddress((addresses ?? []).find((a: any) => a.id === selectedAddressId) ?? {});

  const total = (cart?.deliveryFee ?? 0) + subtotal;
  const belowMinimum = !!cart && subtotal < cart.minOrder;

  const placeOrder = async () => {
    if (!cart) return;
    if (!resolvedAddress) {
      toast.error("Please enter a delivery address");
      return;
    }
    setPlacing(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("Please sign in to place an order");
        navigate({ to: "/auth" });
        return;
      }
      const { data: orderId, error } = await supabase.rpc("create_order", {
        p_vendor_id: cart.vendorId,
        p_items: cart.items.map((i) => ({ menu_item_id: i.menuItemId, quantity: i.quantity })),
        p_delivery_address: resolvedAddress,
        p_customer_note: note.trim() || null,
      });
      if (error) throw error;
      if (!orderId) throw new Error("Order was not created");

      clearCart();
      const { checkoutUrl } = await initiatePaymentFn({ data: { orderId } });
      window.location.href = checkoutUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place order");
      navigate({ to: "/orders" });
    } finally {
      setPlacing(false);
    }
  };

  return (
    <CustomerShell
      topBar={<h1 className="font-display text-lg font-bold">Your cart</h1>}
      showBack
      backTo="/discover"
      containerClassName="mx-auto max-w-2xl px-4 sm:px-6 pb-40 lg:pb-32"
    >
      {!cart || cart.items.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/50 p-10 text-center">
          <ShoppingCart className="mx-auto h-10 w-10 text-zinc-400" />
          <h2 className="font-display text-xl mt-3">Your cart is empty</h2>
          <p className="text-sm text-zinc-500 mt-1">Browse vendors and add something delicious.</p>
          <Link
            to="/discover"
            className="inline-block mt-4 rounded-full bg-[var(--brand-clay)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_18px_-4px_rgba(255,77,77,0.6)] hover:opacity-95"
          >
            Browse vendors
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm text-zinc-500">
            From{" "}
            <Link to="/vendor/$slug" params={{ slug: cart.vendorSlug }} className="font-semibold text-zinc-800 underline">
              {cart.vendorName}
            </Link>
          </p>

          {/* Line items */}
          <section className="mt-5 rounded-3xl bg-white ring-1 ring-zinc-100 shadow-[0_4px_18px_-8px_rgba(0,0,0,0.12)] divide-y divide-zinc-100">
            {cart.items.map((item) => (
              <div key={item.menuItemId} className="flex items-center gap-3 p-3">
                <div className="h-14 w-14 shrink-0 rounded-2xl bg-zinc-100 overflow-hidden">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold line-clamp-1">{item.name}</div>
                  <div className="text-xs text-zinc-500">{fmt(item.price)} each</div>
                </div>
                <QuantityStepper
                  value={item.quantity}
                  onChange={(next) => setQuantity(item.menuItemId, next)}
                  min={1}
                  size="sm"
                />
                <div className="w-20 text-right text-sm font-bold tabular-nums">{fmt(item.price * item.quantity)}</div>
                <button
                  onClick={() => removeItem(item.menuItemId)}
                  className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Remove ${item.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </section>

          {/* Address */}
          <section className="mt-5 rounded-3xl bg-white ring-1 ring-zinc-100 p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[var(--brand-clay)]" />
              <h2 className="font-semibold text-sm">Delivery address</h2>
            </div>
            {addresses && addresses.length > 0 && (
              <select
                className="w-full rounded-2xl bg-zinc-50 ring-1 ring-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-clay)]"
                value={selectedAddressId}
                onChange={(e) => setSelectedAddressId(e.target.value)}
              >
                {addresses.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.label ? `${a.label} — ` : ""}
                    {formatAddress(a)}
                  </option>
                ))}
                <option value="custom">Enter a different address</option>
              </select>
            )}
            {(selectedAddressId === "custom" || !addresses?.length) && (
              <input
                className="w-full rounded-2xl bg-zinc-50 ring-1 ring-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-clay)]"
                placeholder="Street address, city"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            )}
            <div className="flex items-center gap-2 pt-2">
              <StickyNote className="h-4 w-4 text-zinc-400" />
              <h2 className="font-semibold text-sm">Note for the vendor</h2>
            </div>
            <textarea
              className="w-full rounded-2xl bg-zinc-50 ring-1 ring-zinc-200 px-4 py-3 text-sm min-h-[70px] focus:outline-none focus:ring-2 focus:ring-[var(--brand-clay)]"
              placeholder="Allergies, extra instructions… (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </section>

          {/* Totals */}
          <section className="mt-5 rounded-3xl bg-white ring-1 ring-zinc-100 p-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Subtotal</span>
              <span className="font-semibold">{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Delivery fee</span>
              <span className="font-semibold">{fmt(cart.deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-zinc-100 pt-2 mt-2">
              <span>Total</span>
              <span>{fmt(total)}</span>
            </div>
            {belowMinimum && (
              <p className="rounded-2xl bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900 mt-2">
                Minimum order for this vendor is {fmt(cart.minOrder)}. Add {fmt(cart.minOrder - subtotal)} more to checkout.
              </p>
            )}
          </section>
        </>
      )}

      {/* Sticky Place Order */}
      {cart && cart.items.length > 0 && (
        <div className="fixed bottom-20 lg:bottom-4 inset-x-0 z-30 px-4 pointer-events-none">
          <div className="pointer-events-auto mx-auto max-w-md">
            <button
              type="button"
              onClick={placeOrder}
              disabled={placing || belowMinimum || itemCount === 0}
              className="w-full rounded-full bg-[var(--brand-clay)] py-4 text-base font-bold text-white shadow-[0_12px_30px_-8px_rgba(255,77,77,0.7)] disabled:opacity-50"
            >
              {placing ? "Placing order…" : `Place order · ${fmt(total)}`}
            </button>
          </div>
        </div>
      )}
    </CustomerShell>
  );
}
