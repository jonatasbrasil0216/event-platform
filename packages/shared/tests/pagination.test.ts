import { describe, expect, it } from "vitest";
import { publishedEventsQuerySchema } from "../src/schemas/pagination";

describe("publishedEventsQuerySchema", () => {
  it("applies default limit", () => {
    const parsed = publishedEventsQuerySchema.parse({});
    expect(parsed.limit).toBe(12);
    expect(parsed.cursor).toBeUndefined();
  });

  it("coerces limit and preserves category/date", () => {
    const parsed = publishedEventsQuerySchema.parse({
      category: "tech",
      date: "2026-05-01",
      limit: "8"
    });
    expect(parsed.category).toBe("tech");
    expect(parsed.date).toBe("2026-05-01");
    expect(parsed.limit).toBe(8);
  });
});
