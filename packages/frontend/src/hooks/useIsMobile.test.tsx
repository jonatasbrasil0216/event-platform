import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useIsMobile } from "./useIsMobile";

describe("useIsMobile", () => {
  it("tracks matchMedia result after effect", async () => {
    const mql = {
      matches: true,
      media: "(max-width: 767px)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };
    vi.spyOn(window, "matchMedia").mockReturnValue(mql as unknown as MediaQueryList);

    const { result } = renderHook(() => useIsMobile());
    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });
});
