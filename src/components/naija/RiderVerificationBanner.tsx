import { Link } from "@tanstack/react-router";
import { ShieldAlert, ShieldCheck, Clock } from "lucide-react";
import type { RiderVerification } from "@/hooks/useRiderStatus";

/**
 * Tells a rider where they stand on document verification. Claiming jobs is
 * locked until an admin has verified every required document, so this banner
 * is the rider's main signpost during onboarding.
 */
export function RiderVerificationBanner({ verification }: { verification: RiderVerification }) {
  if (verification.status === "loading" || verification.status === "verified") return null;

  if (verification.status === "incomplete") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
        <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <div className="font-semibold text-amber-900">Finish verification to start delivering</div>
          <p className="text-amber-800 mt-0.5">
            Still needed: {verification.missing.join(", ")}. Jobs unlock once an admin verifies your documents.
          </p>
          <Link
            to="/rider/documents"
            className="mt-2 inline-block rounded-full bg-amber-600 text-white px-4 py-1.5 text-xs font-semibold hover:bg-amber-700 transition"
          >
            Upload documents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 flex gap-3">
      <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
      <div className="text-sm">
        <div className="font-semibold text-blue-900">Documents under review</div>
        <p className="text-blue-800 mt-0.5">
          Everything is uploaded. An admin is reviewing your documents — jobs unlock as soon as they approve.
        </p>
      </div>
    </div>
  );
}

/** Small inline badge for the dashboard header once a rider is cleared. */
export function RiderVerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-800 px-2.5 py-1 text-xs font-semibold">
      <ShieldCheck className="h-3.5 w-3.5" /> Verified
    </span>
  );
}
