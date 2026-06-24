import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { u as useServerFn, i as initiatePayment } from "./payments.functions-CXhOIQlE.mjs";
import { s as supabase } from "./client-BLGsQl0B.mjs";
import { u as useCart } from "./router-LlhGIoeI.mjs";
import { C as CustomerShell } from "./CustomerShell-Z8l-rfuQ.mjs";
import { Q as QuantityStepper } from "./customer-ui-mFvR0Vpm.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import "../_libs/seroval.mjs";
import "../_libs/stripe.mjs";
import { $ as ShoppingCart, q as Trash2, a0 as MapPin, a1 as StickyNote } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "async_hooks";
import "stream";
import "crypto";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__query-core.mjs";
import "./server-BJNcc7UM.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "./auth-middleware-C7uuE0z7.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/zod.mjs";
import "./payments.config.server-C-tqAA0S.mjs";
import "node:process";
import "node:crypto";
import "os";
import "events";
import "http";
import "https";
import "../_libs/react-icons.mjs";
import "./Logo-Du-Zai3C.mjs";
function CartPage() {
  const navigate = useNavigate();
  const initiatePaymentFn = useServerFn(initiatePayment);
  const {
    cart,
    setQuantity,
    removeItem,
    clearCart,
    itemCount,
    subtotal
  } = useCart();
  const [address, setAddress] = reactExports.useState("");
  const [selectedAddressId, setSelectedAddressId] = reactExports.useState("custom");
  const [note, setNote] = reactExports.useState("");
  const [placing, setPlacing] = reactExports.useState(false);
  const {
    data: addresses
  } = useQuery({
    queryKey: ["my-addresses-for-checkout"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("addresses").select("*").order("is_default", {
        ascending: false
      });
      if (error) throw error;
      return data ?? [];
    }
  });
  const fmt = (n) => `${cart?.currency === "GBP" ? "£" : "₦"}${Number(n).toLocaleString()}`;
  const formatAddress = (a) => [a.line1, a.line2, a.city, a.postcode].filter(Boolean).join(", ");
  const resolvedAddress = selectedAddressId === "custom" ? address.trim() : formatAddress((addresses ?? []).find((a) => a.id === selectedAddressId) ?? {});
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
      const {
        data: userData
      } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("Please sign in to place an order");
        navigate({
          to: "/auth"
        });
        return;
      }
      const {
        data: orderId,
        error
      } = await supabase.rpc("create_order", {
        p_vendor_id: cart.vendorId,
        p_items: cart.items.map((i) => ({
          menu_item_id: i.menuItemId,
          quantity: i.quantity
        })),
        p_delivery_address: resolvedAddress,
        p_customer_note: note.trim() || null
      });
      if (error) throw error;
      if (!orderId) throw new Error("Order was not created");
      clearCart();
      const {
        checkoutUrl
      } = await initiatePaymentFn({
        data: {
          orderId
        }
      });
      window.location.href = checkoutUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place order");
      navigate({
        to: "/orders"
      });
    } finally {
      setPlacing(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(CustomerShell, { topBar: /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-lg font-bold", children: "Your cart" }), showBack: true, backTo: "/discover", containerClassName: "mx-auto max-w-2xl px-4 sm:px-6 pb-40 lg:pb-32", children: [
    !cart || cart.items.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/50 p-10 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingCart, { className: "mx-auto h-10 w-10 text-zinc-400" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-xl mt-3", children: "Your cart is empty" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-zinc-500 mt-1", children: "Browse vendors and add something delicious." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/discover", className: "inline-block mt-4 rounded-full bg-[var(--brand-clay)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_18px_-4px_rgba(255,77,77,0.6)] hover:opacity-95", children: "Browse vendors" })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-sm text-zinc-500", children: [
        "From",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/vendor/$slug", params: {
          slug: cart.vendorSlug
        }, className: "font-semibold text-zinc-800 underline", children: cart.vendorName })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "mt-5 rounded-3xl bg-white ring-1 ring-zinc-100 shadow-[0_4px_18px_-8px_rgba(0,0,0,0.12)] divide-y divide-zinc-100", children: cart.items.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-14 w-14 shrink-0 rounded-2xl bg-zinc-100 overflow-hidden", children: item.imageUrl && /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: item.imageUrl, alt: item.name, className: "h-full w-full object-cover" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold line-clamp-1", children: item.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-zinc-500", children: [
            fmt(item.price),
            " each"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(QuantityStepper, { value: item.quantity, onChange: (next) => setQuantity(item.menuItemId, next), min: 1, size: "sm" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-20 text-right text-sm font-bold tabular-nums", children: fmt(item.price * item.quantity) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => removeItem(item.menuItemId), className: "grid h-8 w-8 place-items-center rounded-full text-zinc-400 hover:bg-red-50 hover:text-red-600", "aria-label": `Remove ${item.name}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) })
      ] }, item.menuItemId)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-5 rounded-3xl bg-white ring-1 ring-zinc-100 p-4 sm:p-5 space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-4 w-4 text-[var(--brand-clay)]" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-sm", children: "Delivery address" })
        ] }),
        addresses && addresses.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "w-full rounded-2xl bg-zinc-50 ring-1 ring-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-clay)]", value: selectedAddressId, onChange: (e) => setSelectedAddressId(e.target.value), children: [
          addresses.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: a.id, children: [
            a.label ? `${a.label} — ` : "",
            formatAddress(a)
          ] }, a.id)),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "custom", children: "Enter a different address" })
        ] }),
        (selectedAddressId === "custom" || !addresses?.length) && /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "w-full rounded-2xl bg-zinc-50 ring-1 ring-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-clay)]", placeholder: "Street address, city", value: address, onChange: (e) => setAddress(e.target.value) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 pt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(StickyNote, { className: "h-4 w-4 text-zinc-400" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-sm", children: "Note for the vendor" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { className: "w-full rounded-2xl bg-zinc-50 ring-1 ring-zinc-200 px-4 py-3 text-sm min-h-[70px] focus:outline-none focus:ring-2 focus:ring-[var(--brand-clay)]", placeholder: "Allergies, extra instructions… (optional)", value: note, onChange: (e) => setNote(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-5 rounded-3xl bg-white ring-1 ring-zinc-100 p-5 space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-zinc-500", children: "Subtotal" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: fmt(subtotal) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-zinc-500", children: "Delivery fee" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: fmt(cart.deliveryFee) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-base font-bold border-t border-zinc-100 pt-2 mt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Total" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: fmt(total) })
        ] }),
        belowMinimum && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "rounded-2xl bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900 mt-2", children: [
          "Minimum order for this vendor is ",
          fmt(cart.minOrder),
          ". Add ",
          fmt(cart.minOrder - subtotal),
          " more to checkout."
        ] })
      ] })
    ] }),
    cart && cart.items.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed bottom-20 lg:bottom-4 inset-x-0 z-30 px-4 pointer-events-none", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-auto mx-auto max-w-md", children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: placeOrder, disabled: placing || belowMinimum || itemCount === 0, className: "w-full rounded-full bg-[var(--brand-clay)] py-4 text-base font-bold text-white shadow-[0_12px_30px_-8px_rgba(255,77,77,0.7)] disabled:opacity-50", children: placing ? "Placing order…" : `Place order · ${fmt(total)}` }) }) })
  ] });
}
export {
  CartPage as component
};
