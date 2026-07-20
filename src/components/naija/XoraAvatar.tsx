/** Xora's profile picture — the one identity used everywhere Xora appears
 *  (chat header, message bubbles, sidebars, floating buttons). */
export function XoraAvatar({ size = 38, pulsing = false }: { size?: number; pulsing?: boolean }) {
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Clay-to-gold gradient ring */}
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-br from-[var(--brand-clay)] via-[oklch(0.68_0.22_45)] to-[var(--brand-gold)] shadow-md ${pulsing ? "animate-pulse" : ""}`}
      />
      {/* Character portrait — Xora */}
      <div className="absolute inset-[3px] rounded-full overflow-hidden bg-background">
        <img
          src="/xora.jpg"
          alt=""
          className="h-full w-full object-cover object-top scale-[1.15]"
          draggable={false}
          onError={(e) => {
            // Fallback to a big "X" mark so the avatar never renders blank
            // when the image asset is missing.
            (e.currentTarget as HTMLImageElement).style.display = "none";
            const fallback = e.currentTarget.parentElement?.querySelector(".xora-fallback") as HTMLElement | null;
            if (fallback) fallback.style.display = "grid";
          }}
        />
        <span
          className="xora-fallback hidden h-full w-full place-items-center font-display font-extrabold text-[var(--brand-clay)]"
          style={{ fontSize: Math.round(size * 0.42) }}
        >
          X
        </span>
      </div>
      {/* Online dot */}
      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
    </div>
  );
}
