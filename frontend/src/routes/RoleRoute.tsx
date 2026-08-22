import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/utils/constants";
import type { Role } from "@/types/auth";

interface RoleRouteProps {
  allow: Role[];
}

export function RoleRoute({ allow }: RoleRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={ROUTES.login} replace />;
  }

  if (!allow.includes(user.role)) {
    const fallback = user.role === "EMPLOYEE" ? ROUTES.employeeDashboard : ROUTES.adminDashboard;
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
