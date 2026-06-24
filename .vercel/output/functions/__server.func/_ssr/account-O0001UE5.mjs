import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-BLGsQl0B.mjs";
import { C as CustomerShell } from "./CustomerShell-Z8l-rfuQ.mjs";
import { B as Button } from "./button-BC9oXVxV.mjs";
import { A as Avatar, a as AvatarImage, b as AvatarFallback } from "./avatar-DhUB8IKM.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { C as Cropper } from "../_libs/react-easy-crop.mjs";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogFooter } from "./dialog-BKo0Bocc.mjs";
import { R as Root, T as Track, a as Range, b as Thumb } from "../_libs/radix-ui__react-slider.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { h as Route$r } from "./router-LlhGIoeI.mjs";
import "../_libs/stripe.mjs";
import { a3 as User, L as ShoppingBag, a0 as MapPin, J as CreditCard, a4 as Settings, a5 as CircleQuestionMark, a6 as Camera, a7 as LogOut, f as ChevronRight } from "../_libs/lucide-react.mjs";
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
import "../_libs/react-icons.mjs";
import "./Logo-Du-Zai3C.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/radix-ui__react-avatar.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/@radix-ui/react-use-is-hydrated+[...].mjs";
import "../_libs/use-sync-external-store.mjs";
import "../_libs/normalize-wheel.mjs";
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/react-remove-scroll.mjs";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/radix-ui__number.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/tailwind-merge.mjs";
import "./payments.config.server-C-tqAA0S.mjs";
import "node:process";
import "node:crypto";
import "os";
import "events";
import "http";
import "https";
const Slider = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  Root,
  {
    ref,
    className: cn("relative flex w-full touch-none select-none items-center", className),
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Track, { className: "relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Range, { className: "absolute h-full bg-primary" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Thumb, { className: "block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" })
    ]
  }
));
Slider.displayName = Root.displayName;
async function getCroppedBlob(src, area) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  const size = Math.round(Math.min(area.width, area.height));
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, size, size);
  return await new Promise(
    (resolve, reject) => canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Crop failed")), "image/jpeg", 0.92)
  );
}
function AvatarCropDialog({ file, onCancel, onCropped }) {
  const [src, setSrc] = reactExports.useState(null);
  const [crop, setCrop] = reactExports.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = reactExports.useState(1);
  const [area, setArea] = reactExports.useState(null);
  const [saving, setSaving] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!file) {
      setSrc(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setSrc(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const onCropComplete = reactExports.useCallback((_, pixels) => setArea(pixels), []);
  const handleSave = async () => {
    if (!src || !area) return;
    setSaving(true);
    try {
      const blob = await getCroppedBlob(src, area);
      onCropped(blob);
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!file, onOpenChange: (o) => !o && onCancel(), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-md", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Adjust your photo" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative w-full h-72 bg-muted rounded-lg overflow-hidden", children: src && /* @__PURE__ */ jsxRuntimeExports.jsx(
      Cropper,
      {
        image: src,
        crop,
        zoom,
        aspect: 1,
        cropShape: "round",
        showGrid: false,
        onCropChange: setCrop,
        onZoomChange: setZoom,
        onCropComplete
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs text-muted-foreground", children: "Zoom" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Slider,
        {
          min: 1,
          max: 3,
          step: 0.01,
          value: [zoom],
          onValueChange: (v) => setZoom(v[0] ?? 1)
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: onCancel, disabled: saving, children: "Cancel" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSave, disabled: saving || !area, children: saving ? "Saving…" : "Save photo" })
    ] })
  ] }) });
}
function AccountPage() {
  const {
    user
  } = Route$r.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = reactExports.useRef(null);
  const [uploading, setUploading] = reactExports.useState(false);
  const [pendingFile, setPendingFile] = reactExports.useState(null);
  const {
    data: profile
  } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const {
        data
      } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return data;
    }
  });
  const {
    data: roles
  } = useQuery({
    queryKey: ["roles", user.id],
    queryFn: async () => {
      const {
        data
      } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      return data ?? [];
    }
  });
  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({
      to: "/auth",
      replace: true
    });
  };
  const displayName = profile?.full_name || user.email?.split("@")[0] || "Your account";
  const initials = (profile?.full_name || user.email || "?").split(/[\s@]+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
  const roleList = roles?.map((r) => r.role).join(", ") || "customer";
  const handleFilePicked = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }
    setPendingFile(file);
  };
  const handleCropped = async (blob) => {
    setPendingFile(null);
    setUploading(true);
    try {
      const path = `${user.id}/avatar-${Date.now()}.jpg`;
      const {
        error: upErr
      } = await supabase.storage.from("avatars").upload(path, blob, {
        upsert: true,
        contentType: "image/jpeg"
      });
      if (upErr) throw upErr;
      const {
        data: signed,
        error: signErr
      } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signErr || !signed?.signedUrl) throw signErr || new Error("Could not sign URL");
      const {
        error: updErr
      } = await supabase.from("profiles").update({
        avatar_url: signed.signedUrl
      }).eq("id", user.id);
      if (updErr) throw updErr;
      await queryClient.invalidateQueries({
        queryKey: ["profile", user.id]
      });
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };
  const removePhoto = async () => {
    if (!profile?.avatar_url) return;
    setUploading(true);
    try {
      const {
        error
      } = await supabase.from("profiles").update({
        avatar_url: null
      }).eq("id", user.id);
      if (error) throw error;
      await queryClient.invalidateQueries({
        queryKey: ["profile", user.id]
      });
      toast.success("Profile photo removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove photo");
    } finally {
      setUploading(false);
    }
  };
  const menuItems = [{
    label: "Personal Information",
    Icon: User,
    to: "/personal-info",
    hint: user.email ?? void 0
  }, {
    label: "My Orders",
    Icon: ShoppingBag,
    to: "/orders"
  }, {
    label: "Addresses",
    Icon: MapPin,
    to: "/addresses"
  }, {
    label: "Payment Methods",
    Icon: CreditCard,
    to: "/payment-methods"
  }, {
    label: "Settings",
    Icon: Settings,
    to: "/settings"
  }, {
    label: "Help & Support",
    Icon: CircleQuestionMark,
    to: "/help"
  }];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(CustomerShell, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-md px-4 sm:px-6 py-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Avatar, { className: "h-24 w-24 ring-4 ring-[var(--brand-cream)] shadow-md", children: [
            profile?.avatar_url ? /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarImage, { src: profile.avatar_url, alt: displayName }) : null,
            /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarFallback, { className: "text-2xl font-semibold bg-muted", children: initials || "?" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => fileInputRef.current?.click(), disabled: uploading, "aria-label": "Change profile photo", className: "absolute bottom-0 right-0 h-8 w-8 rounded-full bg-[var(--brand-clay)] ring-4 ring-background flex items-center justify-center text-[var(--brand-cream)] hover:opacity-90 disabled:opacity-60 transition", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", className: "hidden", onChange: handleFilePicked })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => fileInputRef.current?.click(), disabled: uploading, className: "text-sm font-medium text-[var(--brand-clay)] hover:underline disabled:opacity-60", children: "Change photo" }),
          profile?.avatar_url && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-1 w-1 rounded-full bg-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: removePhoto, disabled: uploading, className: "text-sm font-medium text-destructive hover:underline disabled:opacity-60", children: "Remove photo" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-4 font-display text-2xl font-semibold", children: displayName }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: user.email }),
        uploading && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Uploading photo…" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-2 inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize text-muted-foreground", children: roleList })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-8 space-y-3", children: menuItems.map(({
        label,
        Icon,
        to,
        hint
      }) => {
        const inner = /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 rounded-2xl bg-card border border-border px-4 py-4 hover:border-[var(--brand-clay)]/40 transition", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-5 w-5" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 text-left", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium", children: label }),
            hint ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground truncate", children: hint }) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4 text-muted-foreground" })
        ] });
        return /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to, children: inner }) }, label);
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: signOut, className: "w-full justify-start gap-4 rounded-2xl border-border bg-card px-4 py-6 h-auto text-foreground hover:bg-muted", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: "Logout" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarCropDialog, { file: pendingFile, onCancel: () => setPendingFile(null), onCropped: handleCropped })
  ] });
}
export {
  AccountPage as component
};
