import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "./client";
import { useAuthStore } from "../stores/auth";

describe("apiRequest", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null });
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("adds JSON content-type and auth header when token is present", async () => {
    useAuthStore.setState({ token: "token-123", user: null });
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true })
    } as Response);

    const result = await apiRequest<{ ok: boolean }>("/health", { method: "GET", auth: true });
    expect(result.ok).toBe(true);

    const [url, options] = vi.mocked(fetch).mock.calls[0];
    const headers = new Headers((options as RequestInit).headers);
    expect(url).toBe("http://localhost:3001/health");
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.get("authorization")).toBe("Bearer token-123");
  });

  it("throws API-provided error message", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "Invalid input" } })
    } as Response);

    await expect(apiRequest("/events")).rejects.toThrow("Invalid input");
  });

  it("falls back to default error message", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({})
    } as Response);

    await expect(apiRequest("/events")).rejects.toThrow("Request failed");
  });

  it("returns undefined for 204 responses", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => ({ ignored: true })
    } as Response);

    const result = await apiRequest<void>("/events/1", { method: "DELETE", auth: true });
    expect(result).toBeUndefined();
  });
});
