import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store";
import { canAccessRoute, type RouteAccess } from "./access";

type RouteGuardProps = PropsWithChildren<{
  access?: RouteAccess;
}>;

export default function RouteGuard({ access, children }: RouteGuardProps) {
  const location = useLocation();
  const token = useAuthStore((state) => state.token);
  const permissions = useAuthStore((state) => state.permissions);
  const result = canAccessRoute({
    token,
    permissions,
    access,
  });

  if (result.allowed) {
    return <>{children}</>;
  }

  if (result.reason === "unauthorized") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Navigate to="/403" replace />;
}
