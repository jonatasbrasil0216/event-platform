import type { Event, OrganizerEventBucket, PaginatedResponse } from "@event-platform/shared";
import { apiRequest } from "../client";

type EventInput = {
  name: string;
  description: string;
  category: "tech" | "networking" | "workshop" | "social" | "other";
  date: string;
  location: string;
  capacity: number;
};

export type ParsedFilters = {
  category: EventInput["category"] | null;
  dateRange: { from: string | null; to: string | null };
  maxCapacity: number | null;
  minCapacity: number | null;
  keywords: string[];
};

export type ListEventsParams = {
  q?: string;
  category?: EventInput["category"];
  date?: string;
  cursor?: string;
  limit?: number;
};

export type ListMyEventsParams = {
  bucket: OrganizerEventBucket;
  cursor?: string;
  limit?: number;
};

export type OrganizerEventCounts = Record<OrganizerEventBucket, number>;

export const toQueryString = (params: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  const value = query.toString();
  return value ? `?${value}` : "";
};

export const listEventsRequest = (params: ListEventsParams = {}) =>
  apiRequest<PaginatedResponse<Event> & { filters: ParsedFilters | null; warning?: string }>(
    `/events${toQueryString(params)}`,
    {
      method: "GET"
    }
  );

export const listMyEventsRequest = (params: ListMyEventsParams) =>
  apiRequest<PaginatedResponse<Event> & { counts: OrganizerEventCounts }>(`/events/mine${toQueryString(params)}`, {
    method: "GET",
    auth: true
  });

export const getEventRequest = (id: string) =>
  apiRequest<{ event: Event; organizerName: string }>(`/events/${id}`, {
    method: "GET"
  });

export const createEventRequest = (input: EventInput) =>
  apiRequest<{ event: Event }>("/events", {
    method: "POST",
    auth: true,
    body: JSON.stringify(input)
  });

export const updateEventRequest = (id: string, input: Partial<EventInput>) =>
  apiRequest<{ event: Event }>(`/events/${id}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(input)
  });

export const deleteEventRequest = (id: string) =>
  apiRequest<void>(`/events/${id}`, {
    method: "DELETE",
    auth: true
  });

export const cancelEventRequest = (id: string) =>
  apiRequest<{ event: Event }>(`/events/${id}/cancel`, {
    method: "PATCH",
    auth: true
  });

export const republishEventRequest = (id: string) =>
  apiRequest<{ event: Event }>(`/events/${id}/republish`, {
    method: "PATCH",
    auth: true
  });

export const makeEventDraftRequest = (id: string) =>
  apiRequest<{ event: Event }>(`/events/${id}/draft`, {
    method: "PATCH",
    auth: true
  });
