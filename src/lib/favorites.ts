/** Saved (favourite) vendors, persisted per device. */

const KEY = "naijaeats.favorites.vendors.v1";
export const FAVORITES_EVENT = "naijaeats-favorites-changed";

export function loadFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function isFavorite(vendorId: string): boolean {
  return loadFavorites().includes(vendorId);
}

/** Returns the new state: true = now saved, false = removed. */
export function toggleFavorite(vendorId: string): boolean {
  const list = loadFavorites();
  const has = list.includes(vendorId);
  const next = has ? list.filter((id) => id !== vendorId) : [vendorId, ...list];
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(FAVORITES_EVENT));
  return !has;
}
