import { describe, expect, it, vi } from "vitest";
import { apiRequest } from "../client";
import { createEventRequest, listEventsRequest, listMyEventsRequest, toQueryString } from "./index";

vi.mock("../client", () => ({
  apiRequest: vi.fn()
}));

describe("events API helpers", () => {
  it("builds query strings and skips empty values", () => {
    const query = toQueryString({
      q: "music",
      category: "social",
      cursor: undefined,
      empty: ""
    });

    expect(query).toBe("?q=music&category=social");
  });

  it("calls list endpoints with expected paths and options", () => {
    listEventsRequest({ q: "meetup", limit: 8 });
    expect(apiRequest).toHaveBeenCalledWith("/events?q=meetup&limit=8", { method: "GET" });

    listMyEventsRequest({ bucket: "published", limit: 12 });
    expect(apiRequest).toHaveBeenCalledWith("/events/mine?bucket=published&limit=12", { method: "GET", auth: true });
  });

  it("sends JSON body for create event", () => {
    createEventRequest({
      name: "Test Event",
      description: "A useful description",
      category: "tech",
      date: "2026-06-01T10:00",
      location: "Online",
      capacity: 40
    });

    expect(apiRequest).toHaveBeenCalledWith(
      "/events",
      expect.objectContaining({
        method: "POST",
        auth: true
      })
    );
  });
});
