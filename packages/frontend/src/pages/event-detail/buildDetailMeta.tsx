import { CalendarDays, MapPin } from "lucide-react";

import type { DetailMetaItem } from "./types";

export const buildDetailMetaItems = (
  eventDate: string,
  eventTime: string,
  location: string
): DetailMetaItem[] => [
  {
    key: "date",
    icon: <CalendarDays size={14} strokeWidth={1.8} />,
    label: "Date",
    value: eventDate,
    sub: eventTime
  },
  {
    key: "location",
    icon: <MapPin size={14} strokeWidth={1.8} />,
    label: "Location",
    value: location
  }
];
