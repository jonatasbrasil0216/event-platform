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
  apiRequest<{ data: Array<{ registration: Registration; event: Event }> }>("/registrations/mine", {
    method: "GET",
    auth: true
  });
