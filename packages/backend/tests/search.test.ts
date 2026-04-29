import { describe, expect, it } from "vitest";
import { buildFallbackFilters, buildSearchMongoFilter } from "../src/services/search";

describe("search helpers", () => {
  it("builds fallback keyword filters from query", () => {
    const filters = buildFallbackFilters("outdoor tech meetups under 50");
    expect(filters.category).toBeNull();
    expect(filters.keywords).toEqual(["outdoor", "tech", "meetups", "under"]);
  });

  it("builds mongo filter with capacity/date/category", () => {
    const filter = buildSearchMongoFilter({
      category: "tech",
      dateRange: { from: "2026-06-01T00:00:00.000Z", to: "2026-06-30T23:59:59.000Z" },
      maxCapacity: 100,
      minCapacity: 20,
      keywords: ["react"]
    });

    expect(filter.status).toBe("published");
    expect(filter.category).toBe("tech");
    expect(filter.capacity).toEqual({ $lte: 100, $gte: 20 });
    expect(filter.date).toBeTypeOf("object");
  });
});
