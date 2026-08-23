import { apiClient } from "@/api/client";
import type { ForgotPasswordPayload, LoginPayload, ResetPasswordPayload, SignupPayload, User } from "@/types/auth";

export const authApi = {
  // Cookie auth: the backend sets an HttpOnly access_token cookie and
  // returns the user directly — no token in the response body. Signup does
  // the same, so a new account is immediately signed in.
  login: (payload: LoginPayload) => apiClient.post<User>("/api/auth/login", payload),
  signup: (payload: SignupPayload) => apiClient.post<User>("/api/auth/signup", payload),
  me: () => apiClient.get<User>("/api/auth/me"),
  logout: () => apiClient.post<void>("/api/auth/logout"),
  forgotPassword: (payload: ForgotPasswordPayload) =>
    apiClient.post<{ message: string }>("/api/auth/forgot-password", payload),
  resetPassword: (payload: ResetPasswordPayload) =>
    apiClient.post<{ message: string }>("/api/auth/reset-password", payload),
};
