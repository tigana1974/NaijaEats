import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Trash2, ShoppingCart, MapPin, StickyNote, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart, type Cart } from "@/hooks/useCart";
import { initiatePayment } from "@/lib/api/payments.functions";
import { RoleShell } from "@/components/naija/RoleShell";
import { QuantityStepper } from "@/components/naija/customer-ui";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/cart")({
  component: CartPage,
});

function CartPage() {
  const navigate = useNavigate();
  const initiatePaymentFn = useServerFn(initiatePayment);
  const { carts, setQuantity, removeItem, clearVendorCart, itemCount } = useCart();
  
  // Shared checkout state
  const [address, setAddress] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("custom");
  const [note, setNote] = useState("");
  const [placingVendorId, setPlacingVendorId] = useState<string | null>(null);

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

  const formatAddress = (a: any) => [a.line1, a.line2, a.city, a.postcode].filter(Boolean).join(", ");

  const resolvedAddress =
    selectedAddressId === "custom"
      ? address.trim()
      : formatAddress((addresses ?? []).find((a: any) => a.id === selectedAddressId) ?? {});

  const placeOrder = async (vendorCart: Cart) => {
    if (!resolvedAddress) {
      toast.error("Please enter a delivery address");
      return;
    }
    setPlacingVendorId(vendorCart.vendorId);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("Please sign in to place an order");
        navigate({ to: "/auth" });
        return;
      }
      const { data: orderId, error } = await supabase.rpc("create_order", {
        p_vendor_id: vendorCart.vendorId,
        p_items: vendorCart.items.map((i) => ({ menu_item_id: i.menuItemId, quantity: i.quantity })),
        p_delivery_address: resolvedAddress,
        p_customer_note: note.trim() || null,
      });
      if (error) throw error;
      if (!orderId) throw new Error("Order was not created");

      clearVendorCart(vendorCart.vendorId);
      const { checkoutUrl } = await initiatePaymentFn({ data: { orderId } });
      window.location.href = checkoutUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place order");
      navigate({ to: "/orders" });
    } finally {
      setPlacingVendorId(null);
    }
  };

  const vendorCarts = Object.values(carts);

  return (
    <RoleShell
      topBar={<h1 className="font-display text-lg font-bold">Your cart</h1>}
      showBack
      backTo="/discover"
    >
      {vendorCarts.length === 0 ? (
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
        <div className="space-y-8 pb-32">
          {/* Shared Address Selection */}
          <section className="rounded-3xl bg-white ring-1 ring-zinc-100 p-4 sm:p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[var(--brand-clay)]" />
              <h2 className="font-semibold text-sm">Delivery address (for all orders)</h2>
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
              <h2 className="font-semibold text-sm">Shared order note (optional)</h2>
            </div>
            <textarea
              className="w-full rounded-2xl bg-zinc-50 ring-1 ring-zinc-200 px-4 py-3 text-sm min-h-[70px] focus:outline-none focus:ring-2 focus:ring-[var(--brand-clay)]"
              placeholder="Allergies, extra instructions…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </section>

          {/* Individual Vendor Carts */}
          {vendorCarts.map((cart) => {
            const fmt = (n: number) => `${cart.currency === "GBP" ? "£" : "₦"}${Number(n).toLocaleString()}`;
            const subtotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
            const total = cart.deliveryFee + subtotal;
            const belowMinimum = subtotal < cart.minOrder;
            const isPlacing = placingVendorId === cart.vendorId;

            return (
              <section key={cart.vendorId} className="rounded-3xl bg-white ring-1 ring-zinc-100 shadow-[0_4px_18px_-8px_rgba(0,0,0,0.12)] overflow-hidden">
                <div className="bg-zinc-50 border-b border-zinc-100 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-zinc-400" />
                    <Link to="/vendor/$slug" params={{ slug: cart.vendorSlug }} className="font-bold text-zinc-900 hover:underline">
                      {cart.vendorName}
                    </Link>
                  </div>
                  <button
                    onClick={() => clearVendorCart(cart.vendorId)}
                    className="text-xs font-semibold text-red-500 hover:text-red-700"
                  >
                    Clear
                  </button>
                </div>
                
                <div className="divide-y divide-zinc-100">
                  {cart.items.map((item) => (
                    <div key={item.menuItemId} className="flex items-center gap-3 p-4">
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
                        onChange={(next) => setQuantity(cart.vendorId, item.menuItemId, next)}
                        min={1}
                        size="sm"
                      />
                      <div className="w-20 text-right text-sm font-bold tabular-nums">{fmt(item.price * item.quantity)}</div>
                      <button
                        onClick={() => removeItem(cart.vendorId, item.menuItemId)}
                        className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="bg-zinc-50/50 p-4 space-y-2 border-t border-zinc-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Subtotal</span>
                    <span className="font-semibold">{fmt(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Delivery fee</span>
                    <span className="font-semibold">{fmt(cart.deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 mt-2 border-t border-zinc-200">
                    <span>Total</span>
                    <span>{fmt(total)}</span>
                  </div>
                  
                  {belowMinimum && (
                    <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-900 mt-3">
                      Minimum order is {fmt(cart.minOrder)}. Add {fmt(cart.minOrder - subtotal)} more.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => placeOrder(cart)}
                    disabled={isPlacing || belowMinimum || cart.items.length === 0}
                    className="w-full mt-4 rounded-xl bg-[var(--brand-clay)] py-3.5 text-sm font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
                  >
                    {isPlacing ? "Placing order…" : `Checkout ${cart.vendorName}`}
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </RoleShell>
  );
}
