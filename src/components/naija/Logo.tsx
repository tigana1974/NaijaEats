/**
 * Placeholder mark standing in for the real Naija Eats logo.
 *
 * The original logo only ever existed in this project as a Lovable asset
 * pointer (src/assets/naija-eats-logo.png.asset.json -> a /__l5e/... URL
 * served by Lovable's own hosting) — the actual PNG was never included in
 * the exported project files, so it 404s anywhere other than Lovable's
 * platform. This is a self-contained SVG so the header/auth pages always
 * render something, locally or anywhere else this gets deployed.
 *
 * To restore the real brand mark: export the original PNG from the Lovable
 * project's asset library, drop it in src/assets/naija-eats-logo.png, and
 * swap each `<Logo className=... />` usage back to
 * `<img src={naijaEatsLogo} ... />` with a normal `import naijaEatsLogo from
 * "@/assets/naija-eats-logo.png"`.
 */
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <img src="/logo.png" className={className} alt="Naija Eats Logo" />
  );
}
