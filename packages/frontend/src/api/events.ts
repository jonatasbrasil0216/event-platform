import type { Event } from "@event-platform/shared";
import { apiRequest } from "./client";

type EventInput = {
  name: string;
  description: string;
  category: "tech" | "networking" | "workshop" | "social" | "other";
  date: string;
  location: string;
  capacity: number;
};

export const listEventsRequest = () =>
  apiRequest<{ data: Event[]; nextCursor: null }>("/events", {
    method: "GET"
  });

export const listMyEventsRequest = () =>
  apiRequest<{ data: Event[] }>("/events/mine", {
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
