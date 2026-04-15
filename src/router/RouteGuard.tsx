import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { APP_ROUTE_PATHS } from "@constants";
import { useAuthStore } from "@store";
import { buildLoginPath, buildRoutePath } from "@utils";
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
    return (
      <Navigate
        to={buildLoginPath(buildRoutePath(location))}
        replace
        state={{ from: location }}
      />
    );
  }

  return <Navigate to={APP_ROUTE_PATHS.FORBIDDEN} replace />;
}
