import { useEffect, useState } from "react";

export type Country = "NG" | "UK";

const KEY = "ui_country";
const EVENT = "naijaeats:country-changed";

/**
 * Shared NG/UK market switch. Persists to localStorage under the same
 * `ui_country` key the pages already used, and broadcasts changes so every
 * mounted consumer (desktop top bar toggle, discover, groceries, search)
 * re-renders together.
 */
export function useCountry(): [Country, (c: Country) => void] {
  const [country, setCountryState] = useState<Country>(
    () => (typeof window !== "undefined" && (localStorage.getItem(KEY) as Country)) || "NG",
  );

  useEffect(() => {
    const sync = () => setCountryState(((localStorage.getItem(KEY) as Country) || "NG"));
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync); // cross-tab
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setCountry = (c: Country) => {
    localStorage.setItem(KEY, c);
    setCountryState(c);
    window.dispatchEvent(new Event(EVENT));
  };

  return [country, setCountry];
}

/** True when the user has explicitly picked a market (used to decide whether
 * a profile's home country should seed the toggle). */
export function hasStoredCountry(): boolean {
  return typeof window !== "undefined" && localStorage.getItem(KEY) !== null;
}
