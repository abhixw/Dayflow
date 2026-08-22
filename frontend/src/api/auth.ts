import { apiClient } from "@/api/client";
import type {
  LoginPayload,
  LoginResponse,
  SignupPayload,
  SignupResponse,
  User,
  VerifyEmailPayload,
} from "@/types/auth";

export const authApi = {
  login: (payload: LoginPayload) => apiClient.post<LoginResponse>("/api/auth/login", payload),
  signup: (payload: SignupPayload) => apiClient.post<SignupResponse>("/api/auth/signup", payload),
  me: () => apiClient.get<User>("/api/auth/me"),
  logout: () => apiClient.post<void>("/api/auth/logout"),
  // Path not in the given contract; update once the real backend route is known.
  verifyEmail: (payload: VerifyEmailPayload) => apiClient.post<{ message: string }>("/api/auth/verify-email", payload),
};
