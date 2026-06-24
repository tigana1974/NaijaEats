import { b as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { Q as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { c as createRouter, a as createRootRouteWithContext, u as useRouter, L as Link, O as Outlet, H as HeadContent, S as Scripts, b as createFileRoute, l as lazyRouteComponent } from "../_libs/tanstack__react-router.mjs";
import { S as redirect } from "../_libs/tanstack__router-core.mjs";
import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { T as Toaster$1 } from "../_libs/sonner.mjs";
import { s as supabase } from "./client-DVFnSlur.mjs";
import { S as Stripe } from "../_libs/stripe.mjs";
import { g as getPaymentConfig, s as supabaseAdmin } from "./payments.config.server-C-tqAA0S.mjs";
import { createHmac, timingSafeEqual } from "node:crypto";
import "../_libs/react-dom.mjs";
import "util";
import "async_hooks";
import "stream";
import "crypto";
import "node:stream";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "os";
import "events";
import "http";
import "https";
import "node:process";
const appCss = "/assets/styles-BpwPEguz.css";
const Toaster = ({ ...props }) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Toaster$1,
    {
      className: "toaster group",
      toastOptions: {
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
        }
      },
      ...props
    }
  );
};
const CartContext = reactExports.createContext(null);
const STORAGE_KEY = "naijaeats_cart_v1";
function readCart() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function CartProvider({ children }) {
  const [cart, setCart] = reactExports.useState(null);
  reactExports.useEffect(() => {
    setCart(readCart());
  }, []);
  reactExports.useEffect(() => {
    if (typeof window === "undefined") return;
    if (cart) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    else window.localStorage.removeItem(STORAGE_KEY);
  }, [cart]);
  const addItem = (vendor, item) => {
    if (cart && cart.vendorId !== vendor.id) return "different_vendor";
    setCart((prev) => {
      const base = prev && prev.vendorId === vendor.id ? prev : {
        vendorId: vendor.id,
        vendorName: vendor.name,
        vendorSlug: vendor.slug,
        currency: vendor.currency,
        deliveryFee: vendor.deliveryFee,
        minOrder: vendor.minOrder,
        items: []
      };
      const existingIdx = base.items.findIndex((i) => i.menuItemId === item.menuItemId);
      const items = existingIdx >= 0 ? base.items.map((i, idx) => idx === existingIdx ? { ...i, quantity: i.quantity + 1 } : i) : [...base.items, { ...item, quantity: 1 }];
      return { ...base, items };
    });
    return "added";
  };
  const confirmSwitchVendor = (vendor, item) => {
    setCart({
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorSlug: vendor.slug,
      currency: vendor.currency,
      deliveryFee: vendor.deliveryFee,
      minOrder: vendor.minOrder,
      items: [{ ...item, quantity: 1 }]
    });
  };
  const removeItem = (menuItemId) => {
    setCart((prev) => {
      if (!prev) return prev;
      const items = prev.items.filter((i) => i.menuItemId !== menuItemId);
      return items.length ? { ...prev, items } : null;
    });
  };
  const setQuantity = (menuItemId, quantity) => {
    if (quantity < 1) return removeItem(menuItemId);
    setCart((prev) => {
      if (!prev) return prev;
      return { ...prev, items: prev.items.map((i) => i.menuItemId === menuItemId ? { ...i, quantity } : i) };
    });
  };
  const clearCart = () => setCart(null);
  const { itemCount, subtotal } = reactExports.useMemo(() => {
    if (!cart) return { itemCount: 0, subtotal: 0 };
    return {
      itemCount: cart.items.reduce((s, i) => s + i.quantity, 0),
      subtotal: cart.items.reduce((s, i) => s + i.price * i.quantity, 0)
    };
  }, [cart]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    CartContext.Provider,
    {
      value: { cart, addItem, confirmSwitchVendor, removeItem, setQuantity, clearCart, itemCount, subtotal },
      children
    }
  );
}
function useCart() {
  const ctx = reactExports.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
function NotFoundComponent() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-7xl font-bold text-foreground", children: "404" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 text-xl font-semibold text-foreground", children: "Page not found" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "The page you're looking for doesn't exist or has been moved." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
        children: "Go home"
      }
    ) })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router2 = useRouter();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold tracking-tight text-foreground", children: "This page didn't load" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Something went wrong on our end. You can try refreshing or head back home." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "a",
        {
          href: "/",
          className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
          children: "Go home"
        }
      )
    ] })
  ] }) });
}
const Route$L = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Naija Eats — The Home of African & Authentic Food" },
      { name: "description", content: "Order from home chefs, African & Caribbean restaurants, ethnic groceries, and book personal chefs. Cooked with culture, delivered fresh." },
      { name: "author", content: "Naija Eats" },
      { property: "og:title", content: "Naija Eats — The Home of African & Authentic Food" },
      { property: "og:description", content: "Order from home chefs, African & Caribbean restaurants, ethnic groceries, and book personal chefs. Cooked with culture, delivered fresh." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Naija Eats — The Home of African & Authentic Food" },
      { name: "twitter:description", content: "Order from home chefs, African & Caribbean restaurants, ethnic groceries, and book personal chefs. Cooked with culture, delivered fresh." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/WwfEWjKFFmQR7zXd4Diy2oZplB92/social-images/social-1780595681268-Naija_Eats_logo_Transparent_2.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/WwfEWjKFFmQR7zXd4Diy2oZplB92/social-images/social-1780595681268-Naija_Eats_logo_Transparent_2.webp" }
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400..800;1,400..800&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap" }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("head", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$L.useRouteContext();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CartProvider, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Toaster, { richColors: true, position: "top-center" })
  ] }) });
}
const BASE_URL = "";
const Route$K = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries = [{ path: "/", changefreq: "weekly", priority: "1.0" }];
        const urls = entries.map(
          (e) => `  <url>
    <loc>${BASE_URL}${e.path}</loc>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
        );
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" }
        });
      }
    }
  }
});
const $$splitComponentImporter$H = () => import("./auth-B1VwGEb7.mjs");
const Route$J = createFileRoute("/auth")({
  head: () => ({
    meta: [{
      title: "Sign in — Naija Eats"
    }, {
      name: "description",
      content: "Sign in or create your Naija Eats account."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$H, "component")
});
const $$splitComponentImporter$G = () => import("./route-BFsOu0JM.mjs");
const Route$I = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/auth"
      });
    }
    return {
      user: data.user
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$G, "component")
});
const $$splitComponentImporter$F = () => import("./index-CwuxsAZv.mjs");
const Route$H = createFileRoute("/")({
  head: () => ({
    meta: [{
      title: "Naija Eats — The Home of African & Authentic Food, Delivered"
    }, {
      name: "description",
      content: "Order from home chefs, African & Caribbean restaurants, and ethnic grocers. Book personal chefs. Cooked with culture, delivered fresh."
    }, {
      property: "og:title",
      content: "Naija Eats — Cooked with Culture, Delivered Fresh"
    }, {
      property: "og:description",
      content: "The food ecosystem for African & authentic cuisine. Home chefs, restaurants, groceries, and personal chef experiences."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$F, "component")
});
const $$splitNotFoundComponentImporter$1 = () => import("./vendor._slug-D_6HA2Pl.mjs");
const $$splitErrorComponentImporter = () => import("./vendor._slug-D32zjWwA.mjs");
const $$splitComponentImporter$E = () => import("./vendor._slug--5mI3y4I.mjs");
const Route$G = createFileRoute("/vendor/$slug")({
  head: ({
    params
  }) => ({
    meta: [{
      title: `${params.slug} — Naija Eats`
    }, {
      name: "description",
      content: "Browse the menu and order on Naija Eats."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$E, "component"),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter, "errorComponent"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter$1, "notFoundComponent")
});
const $$splitComponentImporter$D = () => import("./wallet-Bo2Ng4wy.mjs");
const Route$F = createFileRoute("/_authenticated/wallet")({
  component: lazyRouteComponent($$splitComponentImporter$D, "component")
});
const $$splitComponentImporter$C = () => import("./settings-BdA9ABwf.mjs");
const Route$E = createFileRoute("/_authenticated/settings")({
  component: lazyRouteComponent($$splitComponentImporter$C, "component")
});
const $$splitComponentImporter$B = () => import("./search-CvJGaZG3.mjs");
const Route$D = createFileRoute("/_authenticated/search")({
  component: lazyRouteComponent($$splitComponentImporter$B, "component")
});
const $$splitComponentImporter$A = () => import("./referrals-Bxg13Vt8.mjs");
const Route$C = createFileRoute("/_authenticated/referrals")({
  component: lazyRouteComponent($$splitComponentImporter$A, "component")
});
const $$splitComponentImporter$z = () => import("./personal-info-tukBB13i.mjs");
const Route$B = createFileRoute("/_authenticated/personal-info")({
  component: lazyRouteComponent($$splitComponentImporter$z, "component")
});
const $$splitComponentImporter$y = () => import("./payment-methods-CkFSUx6t.mjs");
const Route$A = createFileRoute("/_authenticated/payment-methods")({
  component: lazyRouteComponent($$splitComponentImporter$y, "component")
});
const $$splitComponentImporter$x = () => import("./orders-Bc3515IM.mjs");
const Route$z = createFileRoute("/_authenticated/orders")({
  component: lazyRouteComponent($$splitComponentImporter$x, "component")
});
const $$splitComponentImporter$w = () => import("./notifications-DFNMwGX-.mjs");
const Route$y = createFileRoute("/_authenticated/notifications")({
  component: lazyRouteComponent($$splitComponentImporter$w, "component")
});
const $$splitComponentImporter$v = () => import("./help-Da8zvjVh.mjs");
const Route$x = createFileRoute("/_authenticated/help")({
  component: lazyRouteComponent($$splitComponentImporter$v, "component")
});
const $$splitComponentImporter$u = () => import("./groceries-Bx1FajzQ.mjs");
const Route$w = createFileRoute("/_authenticated/groceries")({
  component: lazyRouteComponent($$splitComponentImporter$u, "component")
});
const $$splitComponentImporter$t = () => import("./discover-BtBVDYh9.mjs");
const Route$v = createFileRoute("/_authenticated/discover")({
  component: lazyRouteComponent($$splitComponentImporter$t, "component")
});
const $$splitComponentImporter$s = () => import("./cart-BsR5X_NP.mjs");
const Route$u = createFileRoute("/_authenticated/cart")({
  component: lazyRouteComponent($$splitComponentImporter$s, "component")
});
const $$splitComponentImporter$r = () => import("./book-DrwNfQx6.mjs");
const Route$t = createFileRoute("/_authenticated/book")({
  component: lazyRouteComponent($$splitComponentImporter$r, "component")
});
const $$splitComponentImporter$q = () => import("./addresses-DxZAPbNr.mjs");
const Route$s = createFileRoute("/_authenticated/addresses")({
  component: lazyRouteComponent($$splitComponentImporter$q, "component")
});
const $$splitComponentImporter$p = () => import("./account-CiO2wU4j.mjs");
const Route$r = createFileRoute("/_authenticated/account")({
  component: lazyRouteComponent($$splitComponentImporter$p, "component")
});
const $$splitComponentImporter$o = () => import("./chats.index-BNEIL3-8.mjs");
const Route$q = createFileRoute("/_authenticated/chats/")({
  component: lazyRouteComponent($$splitComponentImporter$o, "component")
});
const Route$p = createFileRoute("/api/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const config = getPaymentConfig();
        if (!config.stripeSecretKey || !config.stripeWebhookSecret) {
          console.error("[stripe webhook] STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET not configured");
          return new Response("Not configured", { status: 500 });
        }
        const signature = request.headers.get("stripe-signature");
        if (!signature) {
          return new Response("Missing signature", { status: 400 });
        }
        const rawBody = await request.text();
        const stripe = new Stripe(config.stripeSecretKey);
        let event;
        try {
          event = stripe.webhooks.constructEvent(rawBody, signature, config.stripeWebhookSecret);
        } catch (err) {
          console.warn("[stripe webhook] signature verification failed", err instanceof Error ? err.message : err);
          return new Response("Invalid signature", { status: 400 });
        }
        if (event.type === "checkout.session.completed") {
          const session = event.data.object;
          if (session.payment_status === "paid") {
            const { data: payment, error: findError } = await supabaseAdmin.from("payments").select("id, order_id, status").eq("provider", "stripe").eq("provider_reference", session.id).maybeSingle();
            if (findError) {
              console.error("[stripe webhook] lookup failed", findError.message);
              return new Response("Lookup failed", { status: 500 });
            }
            if (payment && payment.status !== "success") {
              const { error: payErr } = await supabaseAdmin.from("payments").update({ status: "success", paid_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", payment.id);
              if (payErr) {
                console.error("[stripe webhook] failed to update payment", payErr.message);
                return new Response("Update failed", { status: 500 });
              }
              const { error: orderErr } = await supabaseAdmin.from("orders").update({ payment_status: "paid" }).eq("id", payment.order_id);
              if (orderErr) {
                console.error("[stripe webhook] failed to update order", orderErr.message);
                return new Response("Update failed", { status: 500 });
              }
            } else if (!payment) {
              console.warn("[stripe webhook] unknown session", session.id);
            }
          }
        }
        return new Response("OK", { status: 200 });
      }
    }
  }
});
const Route$o = createFileRoute("/api/webhooks/paystack")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const config = getPaymentConfig();
        if (!config.paystackSecretKey) {
          console.error("[paystack webhook] PAYSTACK_SECRET_KEY is not configured");
          return new Response("Not configured", { status: 500 });
        }
        const rawBody = await request.text();
        const signature = request.headers.get("x-paystack-signature");
        if (!signature) {
          return new Response("Missing signature", { status: 400 });
        }
        const expected = createHmac("sha512", config.paystackSecretKey).update(rawBody).digest("hex");
        const signatureValid = expected.length === signature.length && timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
        if (!signatureValid) {
          console.warn("[paystack webhook] signature mismatch");
          return new Response("Invalid signature", { status: 401 });
        }
        let event;
        try {
          event = JSON.parse(rawBody);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        if (event.event === "charge.success" && event.data?.reference) {
          const reference = event.data.reference;
          const { data: payment, error: findError } = await supabaseAdmin.from("payments").select("id, order_id, status").eq("provider", "paystack").eq("provider_reference", reference).maybeSingle();
          if (findError) {
            console.error("[paystack webhook] lookup failed", findError.message);
            return new Response("Lookup failed", { status: 500 });
          }
          if (!payment) {
            console.warn("[paystack webhook] unknown reference", reference);
            return new Response("OK", { status: 200 });
          }
          if (payment.status !== "success") {
            const { error: payErr } = await supabaseAdmin.from("payments").update({ status: "success", paid_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", payment.id);
            if (payErr) {
              console.error("[paystack webhook] failed to update payment", payErr.message);
              return new Response("Update failed", { status: 500 });
            }
            const { error: orderErr } = await supabaseAdmin.from("orders").update({ payment_status: "paid" }).eq("id", payment.order_id);
            if (orderErr) {
              console.error("[paystack webhook] failed to update order", orderErr.message);
              return new Response("Update failed", { status: 500 });
            }
          }
        }
        return new Response("OK", { status: 200 });
      }
    }
  }
});
const $$splitComponentImporter$n = () => import("./wallet.top-up-Cw1Kvmaf.mjs");
const Route$n = createFileRoute("/_authenticated/wallet/top-up")({
  component: lazyRouteComponent($$splitComponentImporter$n, "component")
});
const $$splitComponentImporter$m = () => import("./wallet.send-Bu_DIKvU.mjs");
const Route$m = createFileRoute("/_authenticated/wallet/send")({
  component: lazyRouteComponent($$splitComponentImporter$m, "component")
});
const $$splitComponentImporter$l = () => import("./wallet.request-D27vtrN9.mjs");
const Route$l = createFileRoute("/_authenticated/wallet/request")({
  component: lazyRouteComponent($$splitComponentImporter$l, "component")
});
const $$splitComponentImporter$k = () => import("./vendor.profile-BmLBFv4j.mjs");
const Route$k = createFileRoute("/_authenticated/vendor/profile")({
  component: lazyRouteComponent($$splitComponentImporter$k, "component")
});
const $$splitComponentImporter$j = () => import("./vendor.orders-N2sykrJw.mjs");
const Route$j = createFileRoute("/_authenticated/vendor/orders")({
  component: lazyRouteComponent($$splitComponentImporter$j, "component")
});
const $$splitComponentImporter$i = () => import("./vendor.messages-DZ7HK1DA.mjs");
const Route$i = createFileRoute("/_authenticated/vendor/messages")({
  component: lazyRouteComponent($$splitComponentImporter$i, "component")
});
const $$splitComponentImporter$h = () => import("./vendor.menu-DZOoR2cj.mjs");
const Route$h = createFileRoute("/_authenticated/vendor/menu")({
  component: lazyRouteComponent($$splitComponentImporter$h, "component")
});
const $$splitComponentImporter$g = () => import("./vendor.earnings-kslJ6aev.mjs");
const Route$g = createFileRoute("/_authenticated/vendor/earnings")({
  component: lazyRouteComponent($$splitComponentImporter$g, "component")
});
const $$splitComponentImporter$f = () => import("./vendor.dashboard--qSIFLSU.mjs");
const Route$f = createFileRoute("/_authenticated/vendor/dashboard")({
  component: lazyRouteComponent($$splitComponentImporter$f, "component")
});
const $$splitComponentImporter$e = () => import("./rider.earnings-BYoS78a2.mjs");
const Route$e = createFileRoute("/_authenticated/rider/earnings")({
  component: lazyRouteComponent($$splitComponentImporter$e, "component")
});
const $$splitComponentImporter$d = () => import("./rider.documents-BxHptlwu.mjs");
const Route$d = createFileRoute("/_authenticated/rider/documents")({
  component: lazyRouteComponent($$splitComponentImporter$d, "component")
});
const $$splitComponentImporter$c = () => import("./rider.dashboard-DGG2QZN9.mjs");
const Route$c = createFileRoute("/_authenticated/rider/dashboard")({
  component: lazyRouteComponent($$splitComponentImporter$c, "component")
});
const $$splitComponentImporter$b = () => import("./rider.available-CiJPVwmg.mjs");
const Route$b = createFileRoute("/_authenticated/rider/available")({
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
const $$splitComponentImporter$a = () => import("./orders._orderId-R1o1CMOk.mjs");
const Route$a = createFileRoute("/_authenticated/orders/$orderId")({
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./chats._vendorId-Cfg9V6TB.mjs");
const Route$9 = createFileRoute("/_authenticated/chats/$vendorId")({
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./admin.vendors-B13Sq3dH.mjs");
const Route$8 = createFileRoute("/_authenticated/admin/vendors")({
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./admin.riders-xfhucAyK.mjs");
const Route$7 = createFileRoute("/_authenticated/admin/riders")({
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./admin.reports-COALC95F.mjs");
const Route$6 = createFileRoute("/_authenticated/admin/reports")({
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./admin.payouts-CEe8zMMS.mjs");
const Route$5 = createFileRoute("/_authenticated/admin/payouts")({
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./admin.orders-DRyjxkRt.mjs");
const Route$4 = createFileRoute("/_authenticated/admin/orders")({
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./admin.dashboard-CR-xj0cK.mjs");
const Route$3 = createFileRoute("/_authenticated/admin/dashboard")({
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./admin.customers-CI1BVcEj.mjs");
const Route$2 = createFileRoute("/_authenticated/admin/customers")({
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitNotFoundComponentImporter = () => import("./vendor._slug.item._itemId-D4Xl5-5K.mjs");
const $$splitComponentImporter$1 = () => import("./vendor._slug.item._itemId-CAjmoP7b.mjs");
const Route$1 = createFileRoute("/vendor/$slug/item/$itemId")({
  head: ({
    params
  }) => ({
    meta: [{
      title: `Menu item — Naija Eats`
    }, {
      name: "description",
      content: `View a menu item from ${params.slug} on Naija Eats.`
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1, "component"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter, "notFoundComponent")
});
const $$splitComponentImporter = () => import("./vendor.messages._conversationId-DRgunhz7.mjs");
const Route = createFileRoute("/_authenticated/vendor/messages/$conversationId")({
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const SitemapDotxmlRoute = Route$K.update({
  id: "/sitemap.xml",
  path: "/sitemap.xml",
  getParentRoute: () => Route$L
});
const AuthRoute = Route$J.update({
  id: "/auth",
  path: "/auth",
  getParentRoute: () => Route$L
});
const AuthenticatedRouteRoute = Route$I.update({
  id: "/_authenticated",
  getParentRoute: () => Route$L
});
const IndexRoute = Route$H.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$L
});
const VendorSlugRoute = Route$G.update({
  id: "/vendor/$slug",
  path: "/vendor/$slug",
  getParentRoute: () => Route$L
});
const AuthenticatedWalletRoute = Route$F.update({
  id: "/wallet",
  path: "/wallet",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedSettingsRoute = Route$E.update({
  id: "/settings",
  path: "/settings",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedSearchRoute = Route$D.update({
  id: "/search",
  path: "/search",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedReferralsRoute = Route$C.update({
  id: "/referrals",
  path: "/referrals",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedPersonalInfoRoute = Route$B.update({
  id: "/personal-info",
  path: "/personal-info",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedPaymentMethodsRoute = Route$A.update({
  id: "/payment-methods",
  path: "/payment-methods",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedOrdersRoute = Route$z.update({
  id: "/orders",
  path: "/orders",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedNotificationsRoute = Route$y.update({
  id: "/notifications",
  path: "/notifications",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedHelpRoute = Route$x.update({
  id: "/help",
  path: "/help",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedGroceriesRoute = Route$w.update({
  id: "/groceries",
  path: "/groceries",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedDiscoverRoute = Route$v.update({
  id: "/discover",
  path: "/discover",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedCartRoute = Route$u.update({
  id: "/cart",
  path: "/cart",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedBookRoute = Route$t.update({
  id: "/book",
  path: "/book",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedAddressesRoute = Route$s.update({
  id: "/addresses",
  path: "/addresses",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedAccountRoute = Route$r.update({
  id: "/account",
  path: "/account",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedChatsIndexRoute = Route$q.update({
  id: "/chats/",
  path: "/chats/",
  getParentRoute: () => AuthenticatedRouteRoute
});
const ApiWebhooksStripeRoute = Route$p.update({
  id: "/api/webhooks/stripe",
  path: "/api/webhooks/stripe",
  getParentRoute: () => Route$L
});
const ApiWebhooksPaystackRoute = Route$o.update({
  id: "/api/webhooks/paystack",
  path: "/api/webhooks/paystack",
  getParentRoute: () => Route$L
});
const AuthenticatedWalletTopUpRoute = Route$n.update({
  id: "/top-up",
  path: "/top-up",
  getParentRoute: () => AuthenticatedWalletRoute
});
const AuthenticatedWalletSendRoute = Route$m.update({
  id: "/send",
  path: "/send",
  getParentRoute: () => AuthenticatedWalletRoute
});
const AuthenticatedWalletRequestRoute = Route$l.update({
  id: "/request",
  path: "/request",
  getParentRoute: () => AuthenticatedWalletRoute
});
const AuthenticatedVendorProfileRoute = Route$k.update({
  id: "/vendor/profile",
  path: "/vendor/profile",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedVendorOrdersRoute = Route$j.update({
  id: "/vendor/orders",
  path: "/vendor/orders",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedVendorMessagesRoute = Route$i.update({
  id: "/vendor/messages",
  path: "/vendor/messages",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedVendorMenuRoute = Route$h.update({
  id: "/vendor/menu",
  path: "/vendor/menu",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedVendorEarningsRoute = Route$g.update({
  id: "/vendor/earnings",
  path: "/vendor/earnings",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedVendorDashboardRoute = Route$f.update({
  id: "/vendor/dashboard",
  path: "/vendor/dashboard",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedRiderEarningsRoute = Route$e.update({
  id: "/rider/earnings",
  path: "/rider/earnings",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedRiderDocumentsRoute = Route$d.update({
  id: "/rider/documents",
  path: "/rider/documents",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedRiderDashboardRoute = Route$c.update({
  id: "/rider/dashboard",
  path: "/rider/dashboard",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedRiderAvailableRoute = Route$b.update({
  id: "/rider/available",
  path: "/rider/available",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedOrdersOrderIdRoute = Route$a.update({
  id: "/$orderId",
  path: "/$orderId",
  getParentRoute: () => AuthenticatedOrdersRoute
});
const AuthenticatedChatsVendorIdRoute = Route$9.update({
  id: "/chats/$vendorId",
  path: "/chats/$vendorId",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedAdminVendorsRoute = Route$8.update({
  id: "/admin/vendors",
  path: "/admin/vendors",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedAdminRidersRoute = Route$7.update({
  id: "/admin/riders",
  path: "/admin/riders",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedAdminReportsRoute = Route$6.update({
  id: "/admin/reports",
  path: "/admin/reports",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedAdminPayoutsRoute = Route$5.update({
  id: "/admin/payouts",
  path: "/admin/payouts",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedAdminOrdersRoute = Route$4.update({
  id: "/admin/orders",
  path: "/admin/orders",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedAdminDashboardRoute = Route$3.update({
  id: "/admin/dashboard",
  path: "/admin/dashboard",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedAdminCustomersRoute = Route$2.update({
  id: "/admin/customers",
  path: "/admin/customers",
  getParentRoute: () => AuthenticatedRouteRoute
});
const VendorSlugItemItemIdRoute = Route$1.update({
  id: "/item/$itemId",
  path: "/item/$itemId",
  getParentRoute: () => VendorSlugRoute
});
const AuthenticatedVendorMessagesConversationIdRoute = Route.update({
  id: "/$conversationId",
  path: "/$conversationId",
  getParentRoute: () => AuthenticatedVendorMessagesRoute
});
const AuthenticatedOrdersRouteChildren = {
  AuthenticatedOrdersOrderIdRoute
};
const AuthenticatedOrdersRouteWithChildren = AuthenticatedOrdersRoute._addFileChildren(AuthenticatedOrdersRouteChildren);
const AuthenticatedWalletRouteChildren = {
  AuthenticatedWalletRequestRoute,
  AuthenticatedWalletSendRoute,
  AuthenticatedWalletTopUpRoute
};
const AuthenticatedWalletRouteWithChildren = AuthenticatedWalletRoute._addFileChildren(AuthenticatedWalletRouteChildren);
const AuthenticatedVendorMessagesRouteChildren = {
  AuthenticatedVendorMessagesConversationIdRoute
};
const AuthenticatedVendorMessagesRouteWithChildren = AuthenticatedVendorMessagesRoute._addFileChildren(
  AuthenticatedVendorMessagesRouteChildren
);
const AuthenticatedRouteRouteChildren = {
  AuthenticatedAccountRoute,
  AuthenticatedAddressesRoute,
  AuthenticatedBookRoute,
  AuthenticatedCartRoute,
  AuthenticatedDiscoverRoute,
  AuthenticatedGroceriesRoute,
  AuthenticatedHelpRoute,
  AuthenticatedNotificationsRoute,
  AuthenticatedOrdersRoute: AuthenticatedOrdersRouteWithChildren,
  AuthenticatedPaymentMethodsRoute,
  AuthenticatedPersonalInfoRoute,
  AuthenticatedReferralsRoute,
  AuthenticatedSearchRoute,
  AuthenticatedSettingsRoute,
  AuthenticatedWalletRoute: AuthenticatedWalletRouteWithChildren,
  AuthenticatedAdminCustomersRoute,
  AuthenticatedAdminDashboardRoute,
  AuthenticatedAdminOrdersRoute,
  AuthenticatedAdminPayoutsRoute,
  AuthenticatedAdminReportsRoute,
  AuthenticatedAdminRidersRoute,
  AuthenticatedAdminVendorsRoute,
  AuthenticatedChatsVendorIdRoute,
  AuthenticatedRiderAvailableRoute,
  AuthenticatedRiderDashboardRoute,
  AuthenticatedRiderDocumentsRoute,
  AuthenticatedRiderEarningsRoute,
  AuthenticatedVendorDashboardRoute,
  AuthenticatedVendorEarningsRoute,
  AuthenticatedVendorMenuRoute,
  AuthenticatedVendorMessagesRoute: AuthenticatedVendorMessagesRouteWithChildren,
  AuthenticatedVendorOrdersRoute,
  AuthenticatedVendorProfileRoute,
  AuthenticatedChatsIndexRoute
};
const AuthenticatedRouteRouteWithChildren = AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren);
const VendorSlugRouteChildren = {
  VendorSlugItemItemIdRoute
};
const VendorSlugRouteWithChildren = VendorSlugRoute._addFileChildren(
  VendorSlugRouteChildren
);
const rootRouteChildren = {
  IndexRoute,
  AuthenticatedRouteRoute: AuthenticatedRouteRouteWithChildren,
  AuthRoute,
  SitemapDotxmlRoute,
  VendorSlugRoute: VendorSlugRouteWithChildren,
  ApiWebhooksPaystackRoute,
  ApiWebhooksStripeRoute
};
const routeTree = Route$L._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  Route$G as R,
  Route$E as a,
  Route$B as b,
  Route$z as c,
  Route$x as d,
  Route$w as e,
  Route$v as f,
  Route$s as g,
  Route$r as h,
  Route$a as i,
  Route$9 as j,
  Route$1 as k,
  Route as l,
  router as r,
  useCart as u
};
