import { apiClient } from "@/api/client";
import type { LoginPayload, SignupPayload, User, VerifyEmailPayload } from "@/types/auth";

export const authApi = {
  // Cookie auth: the backend sets an HttpOnly access_token cookie and
  // returns the user directly — no token in the response body.
  login: (payload: LoginPayload) => apiClient.post<User>("/api/auth/login", payload),
  signup: (payload: SignupPayload) => apiClient.post<User>("/api/auth/signup", payload),
  me: () => apiClient.get<User>("/api/auth/me"),
  logout: () => apiClient.post<void>("/api/auth/logout"),
  // Path not in the given contract; update once the real backend route is known.
  verifyEmail: (payload: VerifyEmailPayload) => apiClient.post<{ message: string }>("/api/auth/verify-email", payload),
};
