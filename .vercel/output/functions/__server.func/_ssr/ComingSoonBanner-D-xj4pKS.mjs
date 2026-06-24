import { j as jsxRuntimeExports } from "../_libs/react.mjs";
function ComingSoonBanner({ feature }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 mb-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-semibold", children: [
      feature,
      " — Coming soon"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs mt-0.5", children: "This screen is a preview. The numbers and actions below are not connected to live data yet." })
  ] });
}
export {
  ComingSoonBanner as C
};
