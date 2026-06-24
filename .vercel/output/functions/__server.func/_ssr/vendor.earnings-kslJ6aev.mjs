import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { N as Navigate } from "../_libs/tanstack__react-router.mjs";
import { u as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-DVFnSlur.mjs";
import { A as AppShell } from "./AppShell-9a5PrCGV.mjs";
import { u as useMyRole } from "./useMyRole-CK88GRqg.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import "../_libs/stripe.mjs";
import { H as Wallet, ak as Banknote, al as CircleX, N as CircleCheck, ai as LoaderCircle, D as Clock } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
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
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "./router-Ck7azls6.mjs";
import "./payments.config.server-C-tqAA0S.mjs";
import "node:process";
import "node:crypto";
import "os";
import "events";
import "http";
import "https";
import "./avatar-DhUB8IKM.mjs";
import "../_libs/radix-ui__react-avatar.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/@radix-ui/react-use-is-hydrated+[...].mjs";
import "../_libs/use-sync-external-store.mjs";
import "./utils-H80jjgLf.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "./Logo-Du-Zai3C.mjs";
const payoutStatusMeta = {
  requested: {
    label: "Requested",
    cls: "bg-amber-100 text-amber-900",
    Icon: Clock
  },
  processing: {
    label: "Processing",
    cls: "bg-blue-100 text-blue-900",
    Icon: LoaderCircle
  },
  paid: {
    label: "Paid",
    cls: "bg-green-100 text-green-900",
    Icon: CircleCheck
  },
  rejected: {
    label: "Rejected",
    cls: "bg-red-100 text-red-900",
    Icon: CircleX
  }
};
function VendorEarnings() {
  const {
    data: role,
    isLoading: roleLoading
  } = useMyRole();
  const qc = useQueryClient();
  const [requestingFor, setRequestingFor] = reactExports.useState(null);
  const [amountInput, setAmountInput] = reactExports.useState("");
  const [methodInput, setMethodInput] = reactExports.useState("");
  const [submitting, setSubmitting] = reactExports.useState(false);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["vendor-earnings"],
    queryFn: async () => {
      const {
        data: userData
      } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return null;
      const {
        data: vendor
      } = await supabase.from("vendors").select("id").eq("owner_id", uid).maybeSingle();
      if (!vendor) return {
        orders: [],
        totals: {}
      };
      const {
        data: orders
      } = await supabase.from("orders").select("id, total, currency, created_at").eq("vendor_id", vendor.id).eq("payment_status", "paid").order("created_at", {
        ascending: false
      });
      const list = orders ?? [];
      const totals = list.reduce((acc, o) => {
        const c = o.currency || "NGN";
        acc[c] = (acc[c] ?? 0) + Number(o.total || 0);
        return acc;
      }, {});
      return {
        orders: list,
        totals
      };
    }
  });
  const {
    data: payouts
  } = useQuery({
    queryKey: ["my-payouts"],
    enabled: role === "vendor",
    queryFn: async () => {
      const {
        data: data2,
        error
      } = await supabase.from("payouts").select("*").order("requested_at", {
        ascending: false
      });
      if (error) throw error;
      return data2 ?? [];
    }
  });
  const requestedOrPaidByCurrency = (payouts ?? []).reduce((acc, p) => {
    if (p.status === "rejected") return acc;
    acc[p.currency] = (acc[p.currency] ?? 0) + Number(p.amount);
    return acc;
  }, {});
  const availableByCurrency = {};
  Object.entries(data?.totals ?? {}).forEach(([cur, total]) => {
    availableByCurrency[cur] = Math.max(0, Number(total) - (requestedOrPaidByCurrency[cur] ?? 0));
  });
  const submitPayoutRequest = async (currency) => {
    const amount = Number(amountInput);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amount > (availableByCurrency[currency] ?? 0)) {
      toast.error("Amount exceeds your available balance");
      return;
    }
    setSubmitting(true);
    try {
      const {
        data: userData
      } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");
      const {
        error
      } = await supabase.from("payouts").insert({
        user_id: uid,
        amount,
        currency,
        payout_method: methodInput.trim() || null
      });
      if (error) throw error;
      toast.success("Payout requested");
      setRequestingFor(null);
      setAmountInput("");
      setMethodInput("");
      qc.invalidateQueries({
        queryKey: ["my-payouts"]
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not request payout");
    } finally {
      setSubmitting(false);
    }
  };
  if (!roleLoading && role !== "vendor") return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/", replace: true });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl sm:text-4xl font-semibold", children: "Earnings" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1", children: "Revenue from paid orders, and your payout requests." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 grid gap-3 sm:grid-cols-2", children: [
      Object.entries(data?.totals ?? {}).length === 0 && !isLoading && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-6 text-center sm:col-span-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { className: "h-8 w-8 mx-auto text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-muted-foreground", children: "No paid orders yet." })
      ] }),
      Object.entries(data?.totals ?? {}).map(([cur, amt]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-muted-foreground", children: [
          "Lifetime paid revenue (",
          cur,
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 font-display text-3xl font-semibold", children: [
          cur === "GBP" ? "£" : "₦",
          Number(amt).toLocaleString()
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground mt-1", children: [
          "Available to request: ",
          cur === "GBP" ? "£" : "₦",
          (availableByCurrency[cur] ?? 0).toLocaleString()
        ] }),
        requestingFor === cur ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", min: 0, max: availableByCurrency[cur] ?? 0, placeholder: `Amount (max ${availableByCurrency[cur] ?? 0})`, value: amountInput, onChange: (e) => setAmountInput(e.target.value), className: "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { placeholder: "Payout method (e.g. bank, account no.)", value: methodInput, onChange: (e) => setMethodInput(e.target.value), className: "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => submitPayoutRequest(cur), disabled: submitting, className: "flex-1 rounded-lg bg-[var(--brand-clay)] text-[var(--brand-cream)] py-2 text-sm font-semibold disabled:opacity-50", children: submitting ? "Submitting…" : "Submit request" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setRequestingFor(null), className: "rounded-lg border border-border px-3 py-2 text-sm", children: "Cancel" })
          ] })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
          setRequestingFor(cur);
          setAmountInput(String(availableByCurrency[cur] ?? 0));
        }, disabled: (availableByCurrency[cur] ?? 0) <= 0, className: "mt-3 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-40", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Banknote, { className: "h-3.5 w-3.5" }),
          " Request payout"
        ] })
      ] }, cur))
    ] }),
    payouts && payouts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-xl font-semibold", children: "Payout history" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 rounded-2xl border border-border bg-card divide-y divide-border", children: payouts.map((p) => {
        const meta = payoutStatusMeta[p.status] ?? payoutStatusMeta.requested;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 flex items-center justify-between gap-3 flex-wrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-semibold", children: [
              p.currency === "GBP" ? "£" : "₦",
              Number(p.amount).toLocaleString()
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
              "Requested ",
              new Date(p.requested_at).toLocaleDateString(),
              p.payout_method ? ` · ${p.payout_method}` : ""
            ] }),
            p.admin_note && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground mt-0.5", children: [
              "Note: ",
              p.admin_note
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${meta.cls}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(meta.Icon, { className: "h-3 w-3" }),
            " ",
            meta.label
          ] })
        ] }, p.id);
      }) })
    ] })
  ] }) });
}
export {
  VendorEarnings as component
};
