import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2, ShoppingCart, MapPin, StickyNote, Store, ShieldCheck, CreditCard, TicketPercent, Check, CalendarClock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart, type Cart } from "@/hooks/useCart";
import { loadWallet, addWalletTxn } from "@/lib/wallet";
import { RoleShell } from "@/components/naija/RoleShell";
import { QuantityStepper } from "@/components/naija/customer-ui";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/cart")({
  component: CartPage,
});

type CouponKind = "flat" | "percent" | "free_delivery";
type AppliedCoupon = {
  code: string;
  kind: CouponKind;
  value: number; // flat: currency units off, percent: 0-100, free_delivery: unused
  label: string;
};

const COUPONS: Record<string, Omit<AppliedCoupon, "code">> = {
  WELCOME500: { kind: "flat", value: 500, label: "₦500 off your first order" },
  NAIJA10: { kind: "percent", value: 10, label: "10% off subtotal" },
  FREEDEL: { kind: "free_delivery", value: 0, label: "Free delivery" },
};

function CartPage() {
  const navigate = useNavigate();
  const { carts, setQuantity, removeItem, clearVendorCart } = useCart();

  const [address, setAddress] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("custom");
  const [note, setNote] = useState("");
  const [placing, setPlacing] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState("");

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

  // Fetch real vendor logos & cover images for the vendors in the cart so we
  // can show the shop's own branding instead of a generic Store icon.
  const vendorIds = Object.keys(carts);
  const { data: vendorMeta } = useQuery({
    queryKey: ["cart-vendor-meta", vendorIds.join(",")],
    enabled: vendorIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("vendors")
        .select("id, logo_url, cover_image_url, offers_free_delivery")
        .in("id", vendorIds);
      const byId: Record<string, { logo_url: string | null; cover_image_url: string | null; offers_free_delivery: boolean }> = {};
      for (const v of data ?? []) {
        byId[v.id] = { logo_url: v.logo_url, cover_image_url: v.cover_image_url, offers_free_delivery: v.offers_free_delivery };
      }
      return byId;
    },
    staleTime: 5 * 60 * 1000,
  });

  const formatAddress = (a: any) => [a.line1, a.line2, a.city, a.postcode].filter(Boolean).join(", ");

  const resolvedAddress =
    selectedAddressId === "custom"
      ? address.trim()
      : formatAddress((addresses ?? []).find((a: any) => a.id === selectedAddressId) ?? {});

  const vendorCarts = Object.values(carts);

  // Aggregate summary across every vendor in the cart
  const primaryCurrency = vendorCarts[0]?.currency ?? "NGN";
  const symbol = (c: string) => (c === "GBP" ? "£" : "₦");
  const fmtWith = (n: number, c: string) => `${symbol(c)}${Number(n).toLocaleString()}`;

  const grandSubtotal = vendorCarts.reduce(
    (s, c) => s + c.items.reduce((si, i) => si + i.price * i.quantity, 0),
    0,
  );
  
  const getStandardDeliveryFee = (currency: string) => (currency === "GBP" ? 3.50 : 1500);

  const grandDelivery = vendorCarts.reduce((s, c) => {
    const isFree = vendorMeta?.[c.vendorId]?.offers_free_delivery;
    if (isFree) return s;
    return s + getStandardDeliveryFee(c.currency);
  }, 0);

  // Coupon discount is derived from the applied coupon + current totals so it
  // stays live as the customer adds or removes items.
  const couponDiscount = (() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.kind === "flat") return Math.min(appliedCoupon.value, grandSubtotal);
    if (appliedCoupon.kind === "percent") return Math.round((grandSubtotal * appliedCoupon.value) / 100);
    if (appliedCoupon.kind === "free_delivery") return grandDelivery;
    return 0;
  })();

  const grandTotal = Math.max(0, grandSubtotal + grandDelivery - couponDiscount);

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError("Enter a code");
      return;
    }
    const match = COUPONS[code];
    if (!match) {
      setCouponError("That code isn't valid");
      setAppliedCoupon(null);
      return;
    }
    setAppliedCoupon({ code, ...match });
    setCouponError(null);
    toast.success(`Coupon applied · ${match.label}`);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  };

  // A vendor cart is "below minimum" if its own subtotal is under its minOrder.
  const failingVendors = vendorCarts.filter((c) => {
    const sub = c.items.reduce((s, i) => s + i.price * i.quantity, 0);
    return sub < c.minOrder;
  });
  const canCheckout =
    vendorCarts.length > 0 && failingVendors.length === 0 && !!resolvedAddress && !placing;

  const placeAllOrders = async () => {
    if (!resolvedAddress) return toast.error("Please enter a delivery address");
    if (failingVendors.length > 0) {
      const v = failingVendors[0];
      return toast.error(`${v.vendorName} needs a minimum order of ${fmtWith(v.minOrder, v.currency)}`);
    }

    setPlacing(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("Please sign in to place an order");
        navigate({ to: "/auth" });
        return;
      }

      const w = loadWallet();
      if (w.balance < grandTotal) {
        toast.error("Insufficient wallet balance. Please top up your wallet.");
        navigate({ to: "/wallet" });
        return;
      }

      // Create every order first — one row per vendor. Do them serially so a
      // partial failure doesn't leave orphan orders in flight.
      const orderIds: string[] = [];
      for (const cart of vendorCarts) {
        const { data: orderId, error } = await supabase.rpc("create_order", {
          p_vendor_id: cart.vendorId,
          p_items: cart.items.map((i) => ({ menu_item_id: i.menuItemId, quantity: i.quantity })),
          p_delivery_address: resolvedAddress,
          p_customer_note: note.trim() || undefined,
          p_scheduled_for: isScheduled && scheduleTime ? new Date(scheduleTime).toISOString() : undefined,
          p_calculated_delivery_fee: getStandardDeliveryFee(cart.currency),
        });
        if (error) throw error;
        if (!orderId) throw new Error(`Could not create order for ${cart.vendorName}`);
        orderIds.push(orderId as unknown as string);
      }

      // Clear the local cart now that everything is placed on the server.
      for (const c of vendorCarts) clearVendorCart(c.vendorId);

      // Deduct from wallet and mark all orders as paid
      addWalletTxn({
        type: "order",
        title: orderIds.length === 1 ? `Order Payment` : `Multiple Orders Payment`,
        amount: -grandTotal,
      });

      for (const orderId of orderIds) {
        await supabase.rpc("mark_order_paid", { p_order_id: orderId });
      }

      toast.success(`${orderIds.length} order${orderIds.length > 1 ? 's' : ''} paid from wallet`);
      navigate({ to: "/orders" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place order");
      navigate({ to: "/orders" });
    } finally {
      setPlacing(false);
    }
  };

  return (
    <RoleShell
      topBar={<h1 className="font-display text-lg font-bold">Your cart</h1>}
      showBack
      backTo="/discover"
    >
      {vendorCarts.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-border bg-muted/30 p-10 text-center">
          <ShoppingCart className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="font-display text-xl mt-3">Your cart is empty</h2>
          <p className="text-sm text-muted-foreground mt-1">Browse vendors and add something delicious.</p>
          <Link
            to="/discover"
            className="inline-block mt-4 rounded-full bg-[var(--brand-clay)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_18px_-4px_rgba(255,77,77,0.6)] hover:opacity-95"
          >
            Browse vendors
          </Link>
        </div>
      ) : (
        <div className="space-y-4 pt-3 sm:pt-4 pb-52 sm:pb-44">
          <h1 className="hidden lg:block font-display text-2xl font-bold tracking-tight">Your cart</h1>
          {/* ─── Foods grouped by vendor ─── */}
          {vendorCarts.map((cart) => {
            const fmt = (n: number) => fmtWith(n, cart.currency);
            const subtotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
            const belowMinimum = subtotal < cart.minOrder;
            const meta = vendorMeta?.[cart.vendorId];
            const logoSrc = meta?.logo_url || meta?.cover_image_url || null;

            return (
              <section
                key={cart.vendorId}
                className="rounded-3xl bg-card ring-1 ring-border shadow-[0_4px_18px_-8px_rgba(0,0,0,0.12)] overflow-hidden"
              >
                {/* Vendor header — real logo + name */}
                <div className="bg-muted/40 border-b border-border px-4 py-3 flex items-center justify-between gap-3">
                  <Link
                    to="/vendor/$slug"
                    params={{ slug: cart.vendorSlug }}
                    className="flex items-center gap-2.5 min-w-0 group"
                  >
                    <span className="h-10 w-10 shrink-0 rounded-full overflow-hidden ring-1 ring-border bg-muted grid place-items-center">
                      {logoSrc ? (
                        <img
                          src={logoSrc}
                          alt={cart.vendorName}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="grid h-full w-full place-items-center bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]">
                          <Store className="h-4 w-4" />
                        </span>
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        From
                      </div>
                      <div className="font-bold text-sm text-foreground truncate group-hover:underline">
                        {cart.vendorName}
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={() => clearVendorCart(cart.vendorId)}
                    className="text-xs font-semibold text-red-500 hover:text-red-700 shrink-0"
                  >
                    Clear
                  </button>
                </div>

                {/* Items */}
                <div className="divide-y divide-border">
                  {cart.items.map((item) => (
                    <div key={item.menuItemId} className="flex items-center gap-3 p-3.5 sm:p-4">
                      <div className="h-14 w-14 shrink-0 rounded-2xl bg-muted overflow-hidden ring-1 ring-border">
                        {item.imageUrl && (
                          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold line-clamp-1">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{fmt(item.price)} each</div>
                        <div className="mt-1.5 sm:hidden">
                          <QuantityStepper
                            value={item.quantity}
                            onChange={(next) => setQuantity(cart.vendorId, item.menuItemId, next)}
                            min={1}
                            size="sm"
                          />
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        <QuantityStepper
                          value={item.quantity}
                          onChange={(next) => setQuantity(cart.vendorId, item.menuItemId, next)}
                          min={1}
                          size="sm"
                        />
                      </div>
                      <div className="w-20 text-right text-sm font-bold tabular-nums">
                        {fmt(item.price * item.quantity)}
                      </div>
                      <button
                        onClick={() => removeItem(cart.vendorId, item.menuItemId)}
                        className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Vendor mini-summary — inline, no checkout button */}
                <div className="bg-muted/20 px-4 py-3 text-xs flex flex-wrap items-center justify-between gap-2 border-t border-border">
                  <span className="text-muted-foreground">
                    Subtotal <span className="font-semibold text-foreground">{fmt(subtotal)}</span>
                    <span className="mx-2 opacity-40">·</span>
                    Delivery{" "}
                    {vendorMeta?.[cart.vendorId]?.offers_free_delivery ? (
                      <span className="font-semibold text-foreground">
                        <span className="line-through text-muted-foreground mr-1.5">{fmt(getStandardDeliveryFee(cart.currency))}</span>
                        Free
                      </span>
                    ) : (
                      <span className="font-semibold text-foreground">{fmt(getStandardDeliveryFee(cart.currency))}</span>
                    )}
                  </span>
                  {belowMinimum && (
                    <span className="rounded-full bg-amber-100 text-amber-900 px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
                      Add {fmt(cart.minOrder - subtotal)} to hit minimum
                    </span>
                  )}
                </div>
              </section>
            );
          })}

          {/* ─── Delivery Address (BELOW the foods) ─── */}
          <section className="rounded-3xl bg-card ring-1 ring-border p-4 sm:p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[var(--brand-clay)]" />
              <h2 className="font-semibold text-sm">Delivery address</h2>
            </div>
            {addresses && addresses.length > 0 && (
              <select
                className="w-full rounded-2xl bg-muted/40 ring-1 ring-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-clay)] text-foreground"
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
                className="w-full rounded-2xl bg-muted/40 ring-1 ring-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-clay)] text-foreground"
                placeholder="Street address, city"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            )}
            <div className="flex items-center gap-2 pt-2">
              <StickyNote className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm">Order note (optional)</h2>
            </div>
            <textarea
              className="w-full rounded-2xl bg-muted/40 ring-1 ring-border px-4 py-3 text-sm min-h-[70px] focus:outline-none focus:ring-2 focus:ring-[var(--brand-clay)] text-foreground"
              placeholder="Allergies, extra instructions…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </section>

          {/* ─── Coupon / promo code ─── */}
          <section className="rounded-3xl bg-card ring-1 ring-border p-4 sm:p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <TicketPercent className="h-4 w-4 text-[var(--brand-clay)]" />
              <h2 className="font-semibold text-sm">Have a coupon?</h2>
            </div>
            {appliedCoupon ? (
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--brand-forest)]/30 bg-[var(--brand-forest)]/10 px-4 py-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--brand-forest)] text-white shrink-0">
                  <Check className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold tabular-nums text-foreground">{appliedCoupon.code}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{appliedCoupon.label}</div>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-xs font-semibold text-muted-foreground hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    applyCoupon();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    className="flex-1 rounded-2xl bg-muted/40 ring-1 ring-border px-4 py-3 text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[var(--brand-clay)] text-foreground"
                    placeholder="Enter code"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value);
                      if (couponError) setCouponError(null);
                    }}
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-2xl bg-foreground text-background px-5 py-3 text-sm font-semibold hover:opacity-90 transition"
                  >
                    Apply
                  </button>
                </form>
                {couponError && (
                  <div className="text-xs font-semibold text-red-600">{couponError}</div>
                )}
                <div className="text-[11px] text-muted-foreground">
                  Try <span className="font-semibold text-foreground">WELCOME500</span>, <span className="font-semibold text-foreground">NAIJA10</span> or <span className="font-semibold text-foreground">FREEDEL</span>.
                </div>
              </>
            )}
          </section>

          {/* ─── Delivery Time ─── */}
          <section className="rounded-3xl bg-card ring-1 ring-border p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-[var(--brand-clay)]" />
              <h2 className="font-semibold text-sm">Delivery Time</h2>
            </div>
            
            <div className="flex bg-muted/40 p-1 rounded-2xl ring-1 ring-border">
              <button
                type="button"
                onClick={() => setIsScheduled(false)}
                className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all ${!isScheduled ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                ASAP
              </button>
              <button
                type="button"
                onClick={() => setIsScheduled(true)}
                className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all ${isScheduled ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Schedule
              </button>
            </div>

            {isScheduled && (
              <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-xs font-semibold text-muted-foreground">Select a date and time</label>
                <input
                  type="datetime-local"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full rounded-2xl bg-muted/20 ring-1 ring-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-clay)] text-foreground"
                />
              </div>
            )}
          </section>

          {/* ─── Grand total summary — brand-warm accent for instant recognition ─── */}
          <section
            className="relative overflow-hidden rounded-3xl p-4 sm:p-5 space-y-2 shadow-md"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.98 0.02 30) 0%, oklch(0.96 0.04 35) 100%)",
              border: "1px solid oklch(0.85 0.10 30 / 0.35)",
            }}
          >
            <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[var(--brand-clay)]/15 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-[var(--brand-gold)]/20 blur-2xl" />

            <div className="relative flex items-center gap-2 mb-1">
              <div className="text-[10px] uppercase tracking-widest font-bold text-[var(--brand-clay)]">
                Order summary
              </div>
              <span className="rounded-full bg-[var(--brand-clay)]/10 text-[var(--brand-clay)] px-2 py-0.5 text-[10px] font-bold">
                {vendorCarts.length} vendor{vendorCarts.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="relative flex items-center justify-between text-sm">
              <span className="text-zinc-700">Subtotal</span>
              <span className="font-semibold tabular-nums text-zinc-900">{fmtWith(grandSubtotal, primaryCurrency)}</span>
            </div>
            <div className="relative flex items-center justify-between text-sm">
              <span className="text-zinc-700">Delivery</span>
              <span className="font-semibold tabular-nums text-zinc-900">{fmtWith(grandDelivery, primaryCurrency)}</span>
            </div>
            {appliedCoupon && couponDiscount > 0 && (
              <div className="relative flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-1.5 text-[var(--brand-forest)] font-semibold">
                  <TicketPercent className="h-3.5 w-3.5" />
                  Coupon · {appliedCoupon.code}
                </span>
                <span className="font-semibold tabular-nums text-[var(--brand-forest)]">
                  −{fmtWith(couponDiscount, primaryCurrency)}
                </span>
              </div>
            )}
            <div className="relative flex items-center justify-between pt-2 mt-1 border-t border-[var(--brand-clay)]/20">
              <span className="font-bold text-zinc-900">Grand total</span>
              <span className="font-display text-2xl font-extrabold tabular-nums text-[var(--brand-clay)]">
                {fmtWith(grandTotal, primaryCurrency)}
              </span>
            </div>
          </section>

          {/* ─── Sticky single-checkout footer ─── */}
          <div className="fixed bottom-[80px] lg:bottom-4 inset-x-0 lg:left-60 z-30 pb-[max(env(safe-area-inset-bottom),0.75rem)] px-3 sm:px-5 pointer-events-none">
            <div className="pointer-events-auto mx-auto max-w-2xl">
              <div className="rounded-2xl bg-card border border-border shadow-[0_-8px_30px_-6px_rgba(0,0,0,0.15)] p-3 flex items-center gap-3">
                <div className="min-w-0 flex-1 pl-1">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                    Grand total
                  </div>
                  <div className="font-display text-lg font-bold tabular-nums truncate">
                    {fmtWith(grandTotal, primaryCurrency)}
                  </div>
                </div>
                <button
                  onClick={placeAllOrders}
                  disabled={placing}
                  className={`inline-flex items-center gap-2 rounded-2xl px-5 sm:px-6 py-3.5 text-sm font-bold transition-all ${
                    placing
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-gradient-to-r from-[var(--brand-clay)] to-[oklch(0.58_0.22_35)] text-white shadow-lg shadow-[var(--brand-clay)]/30 hover:shadow-xl active:scale-[0.99]"
                  }`}
                >
                  {placing ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      Placing…
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Checkout
                    </>
                  )}
                </button>
              </div>
              <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                <ShieldCheck className="h-3 w-3 text-[var(--brand-forest)]" />
                Secured by Paystack &amp; Stripe · One tap pays for every vendor
              </div>
            </div>
          </div>
        </div>
      )}
    </RoleShell>
  );
}
