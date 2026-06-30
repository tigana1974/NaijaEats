/**
 * Placeholder mark standing in for the real Naija Eats logo.
 */
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <img src="/logo.png" className={className} alt="Naija Eats Logo" />
  );
}
