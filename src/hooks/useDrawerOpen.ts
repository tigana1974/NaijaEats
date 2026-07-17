import { useEffect } from "react";

// How many drawers/sheets are currently mounted. The body class stays on
// until the last one closes, so stacked drawers behave correctly.
let openDrawers = 0;

/**
 * Call from any bottom sheet / drawer / full-screen modal. While mounted,
 * `body.drawer-open` is set and the floating bottom nav hides itself (see
 * styles.css), so the drawer gets the whole screen.
 */
export function useDrawerOpen() {
  useEffect(() => {
    openDrawers += 1;
    document.body.classList.add("drawer-open");
    return () => {
      openDrawers = Math.max(0, openDrawers - 1);
      if (openDrawers === 0) document.body.classList.remove("drawer-open");
    };
  }, []);
}
