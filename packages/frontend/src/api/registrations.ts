import type { Event, PaginatedResponse, Registration, RegistrationBucket } from "@event-platform/shared";
import { apiRequest } from "./client";
import { toQueryString } from "./events";

export const registerForEventRequest = (eventId: string) =>
  apiRequest<{ ok: true }>(`/events/${eventId}/register`, {
    method: "POST",
    auth: true
  });

export const cancelRegistrationRequest = (eventId: string) =>
  apiRequest<{ ok: true }>(`/events/${eventId}/register`, {
    method: "DELETE",
    auth: true
  });

export type ListMyRegistrationsParams = {
  bucket: RegistrationBucket;
  cursor?: string;
  limit?: number;
};

export type ListEventAttendeesParams = {
  q?: string;
  sort?: "recent" | "oldest";
  cursor?: string;
  /** 1-based; omit to use cursor-based paging (legacy API path). */
  page?: number;
  limit?: number;
};

export type RegistrationCounts = Record<RegistrationBucket, number>;

export const listMyRegistrationsRequest = (params: ListMyRegistrationsParams) =>
  apiRequest<
    PaginatedResponse<{ registration: Registration; event: Event; organizerName: string }> & { counts: RegistrationCounts }
  >(
    `/registrations/mine${toQueryString(params)}`,
    {
      method: "GET",
      auth: true
    }
  );

export const listEventAttendeesRequest = (eventId: string, params: ListEventAttendeesParams = {}) =>
  apiRequest<
    PaginatedResponse<{ _id: string; name: string; email: string; registeredAt: string }> & { total: number }
  >(
    `/events/${eventId}/attendees${toQueryString(params)}`,
    {
      method: "GET",
      auth: true
    }
  );
