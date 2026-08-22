import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { RoleRoute } from "@/routes/RoleRoute";
import EmployeeLayout from "@/layouts/EmployeeLayout";
import AdminLayout from "@/layouts/AdminLayout";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import VerifyEmail from "@/pages/auth/VerifyEmail";
import EmployeeDashboard from "@/pages/employee/Dashboard";
import AdminDashboard from "@/pages/admin/Dashboard";
import { useAuth } from "@/hooks/useAuth";
import { LoadingState } from "@/components/common/LoadingState";
import { ROUTES } from "@/utils/constants";

function RoleHome() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingState label="Loading your session..." />;
  if (!user) return <Navigate to={ROUTES.login} replace />;
  return <Navigate to={user.role === "EMPLOYEE" ? ROUTES.employeeDashboard : ROUTES.adminDashboard} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleHome />} />
      <Route path={ROUTES.login} element={<Login />} />
      <Route path={ROUTES.signup} element={<Signup />} />
      <Route path={ROUTES.verifyEmail} element={<VerifyEmail />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allow={["EMPLOYEE"]} />}>
          <Route element={<EmployeeLayout />}>
            <Route path={ROUTES.employeeDashboard} element={<EmployeeDashboard />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allow={["HR", "ADMIN"]} />}>
          <Route element={<AdminLayout />}>
            <Route path={ROUTES.adminDashboard} element={<AdminDashboard />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
