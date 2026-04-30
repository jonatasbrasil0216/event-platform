import type { Event } from "@event-platform/shared";
import { CalendarDays, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { getCategoryLabel, getCategoryToneClass } from "../utils/categoryTheme";

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
  const categoryLabel = getCategoryLabel(event.category);
  const hostInitials = organizerName
    .split(" ")
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 2);

  return (
    <article className="my-reg-card">
      <span className={`my-reg-category category-chip ${getCategoryToneClass(event.category)}`}>
        <span className="category-dot" />
        {categoryLabel}
      </span>
      <h3>{event.name}</h3>
      <p className="my-reg-meta">
        <CalendarDays size={14} strokeWidth={1.8} />
        {new Date(event.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        })}{" "}
        · {new Date(event.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
      </p>
      <p className="my-reg-meta">
        <MapPin size={14} strokeWidth={1.8} />
        {event.location}
      </p>
      <div className="divider" />
      <div className="host-row my-reg-host">
        <span className="host-avatar">{hostInitials}</span>
        <div>
          <p className="host-label">Hosted by</p>
          <p className="my-reg-host-name">{organizerName}</p>
        </div>
      </div>
      <div className="my-reg-actions">
        <Link className="btn btn-secondary" to={`/events/${event._id}`}>
          View details
        </Link>
        <button
          className="btn btn-secondary my-reg-cancel"
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
