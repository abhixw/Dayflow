export type Role = "EMPLOYEE" | "HR" | "ADMIN";

export const PUBLIC_ROLES = ["EMPLOYEE", "HR"] as const;
export type PublicRole = (typeof PUBLIC_ROLES)[number];

export interface User {
  id: string;
  employeeId: string;
  email: string;
  role: Role;
  emailVerified: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface SignupPayload {
  employeeId: string;
  email: string;
  password: string;
  role: PublicRole;
}

export interface SignupResponse {
  message: string;
  user?: User;
}

export interface VerifyEmailPayload {
  token: string;
}

export interface ApiError {
  status: number;
  message: string;
  fieldErrors?: Record<string, string>;
}
