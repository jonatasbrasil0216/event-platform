import { describe, expect, it } from "vitest";
import { parsedSearchFiltersSchema } from "../src/schemas/search";

describe("parsedSearchFiltersSchema dateRange", () => {
  it("accepts full ISO datetimes", () => {
    const r = parsedSearchFiltersSchema.safeParse({
      category: null,
      dateRange: { from: "2026-05-06T00:00:00.000Z", to: "2026-06-06T23:59:59.999Z" },
      maxCapacity: null,
      minCapacity: null,
      keywords: []
    });
    expect(r.success).toBe(true);
  });

  it("accepts YYYY-MM-DD and normalizes to UTC day bounds", () => {
    const r = parsedSearchFiltersSchema.safeParse({
      category: "tech",
      dateRange: { from: "2026-05-06", to: "2026-06-06" },
      maxCapacity: 40,
      minCapacity: null,
      keywords: ["tech"]
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.dateRange.from).toBe("2026-05-06T00:00:00.000Z");
      expect(r.data.dateRange.to).toBe("2026-06-06T23:59:59.999Z");
    }
  });

  it("rejects prose dates", () => {
    const r = parsedSearchFiltersSchema.safeParse({
      category: null,
      dateRange: { from: "May 6, 2026", to: "June 6, 2026" },
      maxCapacity: null,
      minCapacity: null,
      keywords: []
    });
    expect(r.success).toBe(false);
  });
});
