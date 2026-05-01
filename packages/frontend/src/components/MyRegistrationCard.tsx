import type { Event } from "@event-platform/shared";
import { CalendarDays, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { CategoryChip } from "./CategoryChip";
import styles from "./MyRegistrationCard.module.css";

interface MyRegistrationCardProps {
  event: Event;
  organizerName: string;
  cancelDisabled: boolean;
  onCancel: (eventId: string) => void;
}

export const MyRegistrationCard = ({
  event,
  organizerName,
  cancelDisabled,
  onCancel
}: MyRegistrationCardProps) => {
  const hostInitials = organizerName
    .split(" ")
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 2);

  return (
    <article className={styles.card}>
      <CategoryChip category={event.category} />
      <h3>{event.name}</h3>
      <p className={styles.meta}>
        <CalendarDays size={14} strokeWidth={1.8} />
        {new Date(event.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        })}{" "}
        •{" "}
        {new Date(event.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
      </p>
      <p className={styles.meta}>
        <MapPin size={14} strokeWidth={1.8} />
        {event.location}
      </p>
      <div className="divider" />
      <div className={`host-row ${styles.host}`}>
        <span className="host-avatar">{hostInitials}</span>
        <div>
          <p className="host-label">Hosted by</p>
          <p className={styles.hostName}>{organizerName}</p>
        </div>
      </div>
      <div className={styles.actions}>
        <Link className="btn btn-secondary" to={`/events/${event._id}`}>
          View details
        </Link>
        <button
          className={`btn btn-secondary ${styles.cancelBtn}`}
          disabled={cancelDisabled}
          onClick={() => onCancel(event._id)}
          type="button"
        >
          Cancel
        </button>
      </div>
    </article>
  );
};
