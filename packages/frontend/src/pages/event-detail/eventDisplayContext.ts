import type { Event } from "@event-platform/shared";

import { buildDetailMetaItems } from "./buildDetailMeta";

/** Shared derived labels for organizer + attendee detail views. */
export const getEventDisplayContext = (event: Event, organizerName: string) => {
  const ratio = Math.min((event.registeredCount / event.capacity) * 100, 100);
  const hostInitials = organizerName
    ? organizerName
        .split(" ")
        .map((part) => part[0]?.toUpperCase())
        .join("")
        .slice(0, 2)
    : "EO";
  const eventDate = new Date(event.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
  const eventTime = new Date(event.date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit"
  });
  return {
    ratio,
    hostInitials,
    eventDate,
    eventTime,
    detailMetaItems: buildDetailMetaItems(eventDate, eventTime, event.location)
  };
};
