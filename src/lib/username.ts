import { supabase } from "@/integrations/supabase/client";

/**
 * Username utilities for @-handle transfers.
 *
 * The `profiles.username` column may or may not exist in Supabase yet.
 * All queries cast through `as any` so this compiles either way — once the
 * column and unique index are in place, the same code works unchanged.
 *
 * Local echo of our own username is cached in localStorage so it's
 * instantly readable across pages without an extra round-trip.
 */

/**
 * Local echo of the signed-in user's username, keyed by their Supabase auth id
 * so switching accounts on the same browser never leaks one user's handle to
 * another.
 *
 * We ALSO keep a legacy un-keyed slot ("naijaeats.myUsername.v1") purely so
 * we can clear it once at start-up — any user who had the old value cached
 * would have carried it across log-outs before this fix landed.
 */
const KEY_PREFIX = "naijaeats.myUsername.v2::";
const LEGACY_KEY = "naijaeats.myUsername.v1";

if (typeof window !== "undefined") {
  try {
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // storage locked (private mode etc) — no-op
  }
}

export type UsernameCheck =
  | { ok: true; normalized: string }
  | { ok: false; reason: string };

/** Lower-case, strip a leading @, keep only [a-z0-9_]. */
export function normalizeUsername(input: string): string {
  return input.trim().replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9_]/g, "");
}

export function validateUsername(input: string): UsernameCheck {
  const normalized = normalizeUsername(input);
  if (normalized.length < 3) return { ok: false, reason: "At least 3 characters" };
  if (normalized.length > 20) return { ok: false, reason: "Max 20 characters" };
  if (!/^[a-z][a-z0-9_]*$/.test(normalized)) return { ok: false, reason: "Start with a letter, then letters, numbers or _" };
  return { ok: true, normalized };
}

async function currentUid(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Sync (no round-trip) read. Only returns a value when we know the current
 * auth uid — otherwise we have no safe key to read from and return null so
 * the caller doesn't accidentally show another user's cached handle.
 */
export function loadLocalUsername(uid?: string | null): string | null {
  if (typeof window === "undefined") return null;
  if (!uid) return null;
  return localStorage.getItem(KEY_PREFIX + uid);
}

/** Async wrapper that resolves the current uid first. */
export async function loadLocalUsernameForCurrentUser(): Promise<string | null> {
  const uid = await currentUid();
  return loadLocalUsername(uid);
}

export function setLocalUsername(uid: string, username: string | null) {
  if (typeof window === "undefined" || !uid) return;
  const key = KEY_PREFIX + uid;
  if (username) localStorage.setItem(key, username);
  else localStorage.removeItem(key);
}

/**
 * Clear ALL locally cached usernames on this device. Called from the sign-out
 * flow so nothing lingers into the next login.
 */
export function clearAllLocalUsernames() {
  if (typeof window === "undefined") return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(KEY_PREFIX)) keys.push(k);
  }
  for (const k of keys) localStorage.removeItem(k);
  localStorage.removeItem(LEGACY_KEY);
}

/** Is the username already taken by someone else? */
export async function usernameTakenBySomeoneElse(username: string, myUid: string): Promise<boolean> {
  const normalized = normalizeUsername(username);
  if (!normalized) return false;
  try {
    const { data } = await (supabase.from("profiles") as any)
      .select("id")
      .eq("username", normalized)
      .neq("id", myUid)
      .limit(1);
    return Array.isArray(data) && data.length > 0;
  } catch {
    // Column probably doesn't exist yet — allow, we'll fall back to local-only.
    return false;
  }
}

/** Write username to Supabase; return true if the profiles row was updated. */
export async function persistUsername(uid: string, username: string): Promise<boolean> {
  const normalized = normalizeUsername(username);
  try {
    const { error } = await (supabase.from("profiles") as any)
      .update({ username: normalized })
      .eq("id", uid);
    return !error;
  } catch {
    return false;
  }
}

export type FoundUser = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
};

/** Look up a single user by exact username match. Null if not found or column missing. */
export async function findUserByUsername(username: string): Promise<FoundUser | null> {
  const normalized = normalizeUsername(username);
  if (!normalized) return null;
  try {
    const { data } = await (supabase.from("profiles") as any)
      .select("id, username, full_name, avatar_url")
      .eq("username", normalized)
      .maybeSingle();
    return data ?? null;
  } catch {
    return null;
  }
}

/** Search for users whose username starts with the query. Handy for @-mention pickers. */
export async function searchUsersByUsername(query: string, limit = 6): Promise<FoundUser[]> {
  const normalized = normalizeUsername(query);
  if (normalized.length < 2) return [];
  try {
    const { data } = await (supabase.from("profiles") as any)
      .select("id, username, full_name, avatar_url")
      .ilike("username", `${normalized}%`)
      .limit(limit);
    return (data ?? []) as FoundUser[];
  } catch {
    return [];
  }
}
