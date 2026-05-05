import { describe, expect, it } from "vitest";
import {
  DATE_MUST_BE_IN_FUTURE_MESSAGE,
  eventFormSchema,
  isFutureEventDateTime,
  localDateTimeSchema,
  stripMarkdownForReadableLength,
  validateCapacityAtLeastRegistrations,
  validateEventDateNotInPast
} from "./index";

describe("stripMarkdownForReadableLength", () => {
  it("removes common markdown tokens and collapses whitespace", () => {
    expect(stripMarkdownForReadableLength("# **Hello** `_world_`")).toBe("Hello world");
    expect(stripMarkdownForReadableLength("[link](https://example.com) trailing")).toBe("trailing");
    expect(stripMarkdownForReadableLength("![alt](img.png)")).toBe("");
  });

  it("preserves readable letters for counting", () => {
    expect(stripMarkdownForReadableLength("Hello world here")).toHaveLength("Hello world here".length);
  });
});

describe("localDateTimeSchema", () => {
  it("accepts valid local datetime without seconds", () => {
    expect(() => localDateTimeSchema.parse("2026-06-15T14:30")).not.toThrow();
  });

  it("rejects wrong shape or invalid calendar date", () => {
    expect(localDateTimeSchema.safeParse("2026/06/15T14:30").success).toBe(false);
    expect(localDateTimeSchema.safeParse("2026-13-01T99:99").success).toBe(false);
  });
});

describe("eventFormSchema", () => {
  const validBase = {
    name: "Valid event name",
    description: "Ten chars.",
    category: "tech" as const,
    date: "2030-01-01T12:00",
    location: "NYC",
    capacity: 50
  };

  it("accepts a complete valid payload", () => {
    const parsed = eventFormSchema.parse({
      ...validBase,
      description: "This description is comfortably long enough for everyone."
    });
    expect(parsed.name).toBe("Valid event name");
  });

  it("rejects short name after trim", () => {
    const result = eventFormSchema.safeParse({ ...validBase, description: "x".repeat(12), name: "  xx  " });
    expect(result.success).toBe(false);
  });

  it("rejects description with fewer than 10 readable characters despite passing raw length", () => {
    const result = eventFormSchema.safeParse({
      ...validBase,
      description: "#".repeat(10)
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes("readable"))).toBe(true);
    }
  });

  it("rejects invalid local date field", () => {
    const result = eventFormSchema.safeParse({
      ...validBase,
      description: "Enough text here for the form to pass.",
      date: "not-a-datetime"
    });
    expect(result.success).toBe(false);
  });
});

describe("validateEventDateNotInPast", () => {
  const nowMs = new Date("2030-06-01T12:00").getTime();

  it("allows past dates when editing an event that already occurred", () => {
    expect(validateEventDateNotInPast("2001-01-01T10:00", { allowPastDateForEdit: true, nowMs })).toBe(true);
  });

  it("requires future date for new events or future edits", () => {
    expect(validateEventDateNotInPast("2005-05-05T09:00", { allowPastDateForEdit: false, nowMs })).toBe(DATE_MUST_BE_IN_FUTURE_MESSAGE);
    expect(validateEventDateNotInPast("2040-01-02T09:00", { allowPastDateForEdit: false, nowMs })).toBe(true);
  });
});

describe("isFutureEventDateTime", () => {
  it("delegates comparison to parsed instant vs nowMs", () => {
    const nowMs = new Date("2030-01-01T12:00").getTime();
    expect(isFutureEventDateTime("2030-01-01T13:00", nowMs)).toBe(true);
    expect(isFutureEventDateTime("2030-01-01T11:00", nowMs)).toBe(false);
    expect(isFutureEventDateTime("not valid", nowMs)).toBe(false);
  });
});

describe("validateCapacityAtLeastRegistrations", () => {
  it("accepts capacity at or above minimum", () => {
    expect(validateCapacityAtLeastRegistrations(10, 5)).toBe(true);
    expect(validateCapacityAtLeastRegistrations(5, 5)).toBe(true);
  });

  it("returns message when capacity is too low", () => {
    expect(validateCapacityAtLeastRegistrations(4, 5)).toBe(
      "Capacity cannot be lower than current registrations (5)"
    );
  });
});

