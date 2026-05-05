import type { Event } from "@event-platform/shared";
import { CalendarDays, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { CategoryChip } from "../category-chip";
import styles from "./styles.module.css";

interface EventCardProps {
  event: Event;
}

export const EventCard = ({ event }: EventCardProps) => {
  const ratio = event.registeredCount / event.capacity;
  const warn = ratio > 0.85;
  const isFull = event.registeredCount >= event.capacity;
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
    <Link className={`${styles.card} ${isFull ? styles.full : ""}`} to={`/events/${event._id}`}>
      <CategoryChip category={event.category} />
      <h3>{event.name}</h3>
      <p className={styles.meta}>
        <CalendarDays size={14} strokeWidth={1.8} />
        {dateLabel} · {timeLabel}
      </p>
      <p className={`${styles.meta} ${styles.location}`}>
        <MapPin size={14} strokeWidth={1.8} />
        {event.location}
      </p>
      <div className="progress-track event-card-progress">
        <div
          className={`progress-fill ${warn ? "warn" : ""}`}
          style={{ width: `${Math.min(ratio * 100, 100)}%` }}
        />
      </div>
      <p className={`${styles.capacity} ${warn ? styles.warn : ""}`}>
        {isFull
          ? "Full"
          : warn
            ? `${event.registeredCount} / ${event.capacity} · almost full`
            : `${event.registeredCount} / ${event.capacity} registered`}
      </p>
    </Link>
  );
};
