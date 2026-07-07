import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/vendors")({
  component: () => <Navigate to="/admin/stores" replace />,
});
