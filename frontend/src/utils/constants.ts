const rawApiUrl = import.meta.env.VITE_API_URL as string | undefined;
if (!rawApiUrl && import.meta.env.DEV) {
  console.error(
    "[Dayflow] VITE_API_URL is not set. " +
    "Create a .env file in /frontend with VITE_API_URL=http://localhost:8000"
  );
}
export const API_URL = rawApiUrl ?? "";

export const PUBLIC_SIGNUP_ROLES = ["EMPLOYEE", "HR"] as const;

export const ROUTES = {
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",

  employeeDashboard: "/employee/dashboard",
  employeeProfile: "/employee/profile",
  employeeAttendance: "/employee/attendance",
  employeeLeaves: "/employee/leaves",
  employeePayroll: "/employee/payroll",
  employeeNotifications: "/employee/notifications",
  employeeAnalytics: "/employee/analytics",

  adminDashboard: "/management/dashboard",
  adminEmployees: "/management/employees",
  adminAttendance: "/management/attendance",
  adminLeaves: "/management/leaves",
  adminPayroll: "/management/payroll",
  adminNotifications: "/management/notifications",
  adminAnalytics: "/management/analytics",
} as const;
