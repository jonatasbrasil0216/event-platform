import type { ApiError } from "@event-platform/shared";
import { useAuthStore } from "../../stores/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

export const apiRequest = async <T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> => {
  const headers = new Headers(options.headers);
  headers.set("content-type", "application/json");

  if (options.auth) {
    const token = useAuthStore.getState().token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const error = (await response.json()) as ApiError;
    throw new Error(error.error?.message ?? "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};
