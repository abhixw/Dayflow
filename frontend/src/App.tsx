import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { RoleRoute } from "@/routes/RoleRoute";
import EmployeeLayout from "@/layouts/EmployeeLayout";
import AdminLayout from "@/layouts/AdminLayout";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import EmployeeDashboard from "@/pages/employee/Dashboard";
import EmployeeProfile from "@/pages/employee/Profile";
import EmployeeAttendance from "@/pages/employee/Attendance";
import EmployeeLeaves from "@/pages/employee/Leaves";
import EmployeePayroll from "@/pages/employee/Payroll";
import EmployeeNotifications from "@/pages/employee/Notifications";
import EmployeeAnalytics from "@/pages/employee/Analytics";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminEmployees from "@/pages/admin/Employees";
import AdminEmployeeDetails from "@/pages/admin/EmployeeDetails";
import AdminAttendance from "@/pages/admin/Attendance";
import AdminLeaveRequests from "@/pages/admin/LeaveRequests";
import AdminPayroll from "@/pages/admin/Payroll";
import AdminNotifications from "@/pages/admin/Notifications";
import AdminAnalytics from "@/pages/admin/Analytics";
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
      <Route path={ROUTES.forgotPassword} element={<ForgotPassword />} />
      <Route path={ROUTES.resetPassword} element={<ResetPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allow={["EMPLOYEE"]} />}>
          <Route element={<EmployeeLayout />}>
            <Route path={ROUTES.employeeDashboard} element={<EmployeeDashboard />} />
            <Route path={ROUTES.employeeProfile} element={<EmployeeProfile />} />
            <Route path={ROUTES.employeeAttendance} element={<EmployeeAttendance />} />
            <Route path={ROUTES.employeeLeaves} element={<EmployeeLeaves />} />
            <Route path={ROUTES.employeePayroll} element={<EmployeePayroll />} />
            <Route path={ROUTES.employeeNotifications} element={<EmployeeNotifications />} />
            <Route path={ROUTES.employeeAnalytics} element={<EmployeeAnalytics />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allow={["HR", "ADMIN"]} />}>
          <Route element={<AdminLayout />}>
            <Route path={ROUTES.adminDashboard} element={<AdminDashboard />} />
            <Route path={ROUTES.adminEmployees} element={<AdminEmployees />} />
            <Route path={`${ROUTES.adminEmployees}/:employeeId`} element={<AdminEmployeeDetails />} />
            <Route path={ROUTES.adminAttendance} element={<AdminAttendance />} />
            <Route path={ROUTES.adminLeaves} element={<AdminLeaveRequests />} />
            <Route path={ROUTES.adminPayroll} element={<AdminPayroll />} />
            <Route path={ROUTES.adminNotifications} element={<AdminNotifications />} />
            <Route path={ROUTES.adminAnalytics} element={<AdminAnalytics />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
