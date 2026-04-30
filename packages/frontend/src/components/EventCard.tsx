import type { Event } from "@event-platform/shared";
import { CalendarDays, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

interface EventCardProps {
  event: Event;
}

export const EventCard = ({ event }: EventCardProps) => {
  const ratio = event.registeredCount / event.capacity;
  const warn = ratio > 0.85;
  const isFull = event.registeredCount >= event.capacity;
  const categoryLabel = event.category[0].toUpperCase() + event.category.slice(1);
  const dateLabel = new Date(event.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
  const timeLabel = new Date(event.date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit"
  });

  return (
    <Link className={`event-card ${isFull ? "is-full" : ""}`} to={`/events/${event._id}`}>
      <span className={`my-reg-category my-reg-category-${event.category}`}>{categoryLabel}</span>
      <h3>{event.name}</h3>
      <p className="my-reg-meta">
        <CalendarDays size={14} strokeWidth={1.8} />
        {dateLabel} · {timeLabel}
      </p>
      <p className="my-reg-meta">
        <MapPin size={14} strokeWidth={1.8} />
        {event.location}
      </p>
      <div className="progress-track event-card-progress">
        <div className={`progress-fill ${warn ? "warn" : ""}`} style={{ width: `${Math.min(ratio * 100, 100)}%` }} />
      </div>
      <p className={`event-capacity ${warn ? "warn" : ""}`}>
        {isFull
          ? "Full"
          : warn
            ? `${event.registeredCount} / ${event.capacity} · almost full`
            : `${event.registeredCount} / ${event.capacity} registered`}
      </p>
    </Link>
  );
};
