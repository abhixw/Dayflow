export const API_URL = import.meta.env.VITE_API_URL as string;

export const AUTH_TOKEN_STORAGE_KEY = "dayflow_token";

export const PUBLIC_SIGNUP_ROLES = ["EMPLOYEE", "HR"] as const;

export const ROUTES = {
  login: "/login",
  signup: "/signup",
  verifyEmail: "/verify-email",

  employeeDashboard: "/employee/dashboard",
  employeeProfile: "/employee/profile",
  employeeAttendance: "/employee/attendance",
  employeeLeaves: "/employee/leaves",
  employeePayroll: "/employee/payroll",

  adminDashboard: "/admin/dashboard",
  adminEmployees: "/admin/employees",
  adminAttendance: "/admin/attendance",
  adminLeaves: "/admin/leaves",
  adminPayroll: "/admin/payroll",
} as const;
