import { supabase } from "@/integrations/supabase/client";

const DEVICE_ID_KEY = "naijaeats_device_id";
const APP_VERSION = "web-1.0";

function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return "unknown-device";
  }
}

function describeDevice(): { label: string; type: "desktop" | "mobile" | "tablet" } {
  const ua = navigator.userAgent;
  const isTablet = /iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua));
  const isMobile = !isTablet && /Mobi|Android|iPhone/i.test(ua);
  const os = /Windows/i.test(ua)
    ? "Windows"
    : /Mac OS/i.test(ua)
      ? "macOS"
      : /iPhone|iPad|iOS/i.test(ua)
        ? "iOS"
        : /Android/i.test(ua)
          ? "Android"
          : /Linux/i.test(ua)
            ? "Linux"
            : "Unknown OS";
  const browser = /Edg\//i.test(ua)
    ? "Edge"
    : /OPR\//i.test(ua)
      ? "Opera"
      : /Chrome\//i.test(ua)
        ? "Chrome"
        : /Safari\//i.test(ua)
          ? "Safari"
          : /Firefox\//i.test(ua)
            ? "Firefox"
            : "Browser";
  return {
    label: `${browser} on ${os}`,
    type: isTablet ? "tablet" : isMobile ? "mobile" : "desktop",
  };
}

/**
 * Record (or refresh) this browser's device session for the signed-in user.
 * If an admin has revoked this device, the user is signed out.
 * Fails silently — session tracking must never break the app (e.g. before the
 * user_devices migration has been applied).
 */
export async function recordDeviceSession(): Promise<void> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return;

    const deviceId = getDeviceId();
    const { label, type } = describeDevice();

    const { data: existing } = await (supabase as any)
      .from("user_devices")
      .select("id, revoked")
      .eq("user_id", userId)
      .eq("device_id", deviceId)
      .maybeSingle();

    if (existing?.revoked) {
      await supabase.auth.signOut();
      return;
    }

    await (supabase as any).from("user_devices").upsert(
      {
        user_id: userId,
        device_id: deviceId,
        device_label: label,
        device_type: type,
        user_agent: navigator.userAgent.slice(0, 500),
        app_version: APP_VERSION,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "user_id,device_id" },
    );
  } catch {
    // Table may not exist yet or network hiccup — never block the app on this.
  }
}
