import { useEffect, useState } from "react";

/**
 * Tracks whether a floating bar (bottom nav / FAB) should be visible while
 * the user scrolls. Hides when the user scrolls further into the page
 * (content moves up); shows when they scroll back toward the top (content
 * moves down). Always visible near the top of the page so it never
 * disappears when there's nothing to scroll past.
 */
export function useHideOnScroll(threshold: number = 8): boolean {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let last = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - last;
        // Always show once we're back near the top.
        if (y < 40) {
          setVisible(true);
        } else if (delta > threshold) {
          // Scrolled further into content — hide.
          setVisible(false);
        } else if (delta < -threshold) {
          // Scrolled back toward the top — show.
          setVisible(true);
        }
        last = y;
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return visible;
}
