import { API_URL } from "@/utils/constants";
import type { ApiError } from "@/types/auth";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

function isFormData(value: unknown): value is FormData {
  return value instanceof FormData;
}

// Cookie auth: the JWT lives in an HttpOnly cookie the browser attaches
// automatically (credentials: "include"), so the frontend never reads or
// stores it. When any request comes back 401, the session has expired
// server-side; AuthContext registers a handler here to clear local auth
// state and let the existing route guards redirect to /login.
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  let response: Response;
  try {
    const formData = isFormData(body);
    response = await fetch(`${API_URL}${path}`, {
      ...rest,
      credentials: "include",
      headers: {
        ...(body !== undefined && !formData ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : formData ? body : JSON.stringify(body),
    });
  } catch {
    const error: ApiError = { status: 0, message: "Unable to reach the server. Check your connection and try again." };
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    if (response.status === 401) {
      onUnauthorized?.();
    }
    const error: ApiError = {
      status: response.status,
      message: payload?.message ?? payload?.detail ?? defaultMessageFor(response.status),
      fieldErrors: payload?.fieldErrors,
    };
    throw error;
  }

  return payload as T;
}

function defaultMessageFor(status: number): string {
  switch (status) {
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You are not authorized to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 409:
      return "This action conflicts with existing data.";
    case 422:
      return "Some fields need your attention.";
    case 500:
      return "Something went wrong on our end. Please try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "DELETE" }),
};
