import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
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
const SplitErrorComponent = ({
  error
}) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-dvh grid place-items-center p-6 text-center bg-white", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl", children: "Vendor unavailable" }),
  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-zinc-500 mt-2", children: error.message }),
  /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/discover", className: "text-[var(--brand-clay)] hover:underline mt-4 inline-block", children: "Back to discover" })
] }) });
export {
  SplitErrorComponent as errorComponent
};
