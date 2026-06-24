import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { C as CustomerShell } from "./CustomerShell-Z8l-rfuQ.mjs";
import { S as Switch$1, a as SwitchThumb } from "../_libs/radix-ui__react-switch.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { B as Button } from "./button-BC9oXVxV.mjs";
import { s as supabase } from "./client-BLGsQl0B.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { a as Route$E } from "./router-LlhGIoeI.mjs";
import "../_libs/stripe.mjs";
import { e as ChevronLeft, B as Bell, o as Moon, p as Globe, K as KeyRound, q as Trash2 } from "../_libs/lucide-react.mjs";
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
import "../_libs/react-icons.mjs";
import "./Logo-Du-Zai3C.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
import "./payments.config.server-C-tqAA0S.mjs";
import "node:process";
import "node:crypto";
import "os";
import "events";
import "http";
import "https";
const Switch = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Switch$1,
  {
    className: cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    ),
    ...props,
    ref,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      SwitchThumb,
      {
        className: cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
        )
      }
    )
  }
));
Switch.displayName = Switch$1.displayName;
const KEY = "naijaeats.settings";
const defaults = {
  notifications: true,
  darkMode: false,
  language: "English"
};
function SettingsPage() {
  const {
    user
  } = Route$E.useRouteContext();
  const [prefs, setPrefs] = reactExports.useState(defaults);
  reactExports.useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) || "null");
      if (stored) setPrefs({
        ...defaults,
        ...stored
      });
    } catch {
    }
  }, []);
  reactExports.useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(prefs));
    document.documentElement.classList.toggle("dark", prefs.darkMode);
  }, [prefs]);
  const sendReset = async () => {
    if (!user.email) return;
    const {
      error
    } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth`
    });
    if (error) return toast.error(error.message);
    toast.success("Password reset email sent");
  };
  const deleteAccount = () => {
    toast.message("Account deletion request sent", {
      description: "Our team will reach out within 24 hours to confirm."
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(CustomerShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-md px-4 sm:px-6 py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/account", className: "inline-flex items-center text-sm text-muted-foreground hover:text-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-4 w-4" }),
      " Back"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl font-semibold mt-3", children: "Settings" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-6 space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { Icon: Bell, title: "Push notifications", hint: "Order updates and offers", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: prefs.notifications, onCheckedChange: (v) => setPrefs({
        ...prefs,
        notifications: v
      }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { Icon: Moon, title: "Dark mode", hint: "Easier on the eyes at night", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: prefs.darkMode, onCheckedChange: (v) => setPrefs({
        ...prefs,
        darkMode: v
      }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { Icon: Globe, title: "Language", hint: prefs.language, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: prefs.language, onChange: (e) => setPrefs({
        ...prefs,
        language: e.target.value
      }), className: "rounded-full border border-border bg-background px-3 py-1.5 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { children: "English" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { children: "Pidgin" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { children: "Yoruba" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { children: "Igbo" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { children: "Hausa" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-8 text-xs uppercase tracking-wider text-muted-foreground font-semibold", children: "Account" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: sendReset, variant: "outline", className: "w-full justify-start gap-3 rounded-2xl bg-card border-border h-auto py-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-10 w-10 place-items-center rounded-full bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: "Change password" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: deleteAccount, variant: "outline", className: "w-full justify-start gap-3 rounded-2xl bg-card border-border h-auto py-4 text-[var(--brand-clay)] hover:text-[var(--brand-clay)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-10 w-10 place-items-center rounded-full bg-[var(--brand-clay)]/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: "Request account deletion" })
      ] })
    ] })
  ] }) });
}
function Row({
  Icon,
  title,
  hint,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 rounded-2xl bg-card border border-border px-4 py-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-10 w-10 place-items-center rounded-full bg-muted text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-5 w-5" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium", children: title }),
      hint && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground truncate", children: hint })
    ] }),
    children
  ] });
}
export {
  SettingsPage as component
};
