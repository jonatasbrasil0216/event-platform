import type { Event, Registration } from "@event-platform/shared";
import { apiRequest } from "./client";

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

export const listMyRegistrationsRequest = () =>
  apiRequest<{ data: Array<{ registration: Registration; event: Event; organizerName: string }> }>(
    "/registrations/mine",
    {
      method: "GET",
      auth: true
    }
  );

export const listEventAttendeesRequest = (eventId: string) =>
  apiRequest<{ data: Array<{ _id: string; name: string; email: string; registeredAt: string }>; total: number }>(
    `/events/${eventId}/attendees`,
    {
      method: "GET",
      auth: true
    }
  );
