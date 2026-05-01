import type { Event } from "@event-platform/shared";
import { CalendarDays, Ellipsis, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CategoryChip } from "./CategoryChip";
import { ConfirmDialog } from "./ConfirmDialog";
import styles from "./MyEventCard.module.css";

interface MyEventCardProps {
  event: Event;
  onCancel: (eventId: string) => void;
  onRepublish: (eventId: string) => void;
  onDiscard: (eventId: string) => void;
  onDuplicate: (event: Event) => void;
  cancelDisabled: boolean;
  republishDisabled: boolean;
  discardDisabled: boolean;
  duplicateDisabled: boolean;
}

export const MyEventCard = ({
  event,
  onCancel,
  onRepublish,
  onDiscard,
  onDuplicate,
  cancelDisabled,
  republishDisabled,
  discardDisabled,
  duplicateDisabled
}: MyEventCardProps) => {
  const ratio = event.capacity ? event.registeredCount / event.capacity : 0;
  const warn = ratio > 0.85;
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"duplicate" | "cancel" | "republish" | "discard" | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const timeLabel = new Date(event.date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit"
  });

  useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  return (
    <article className={styles.card}>
      <div className={styles.topRow}>
        <CategoryChip category={event.category} />
        <div className="my-events-menu-wrap" ref={menuRef}>
          <button
            className="my-events-more"
            disabled={cancelDisabled || republishDisabled || discardDisabled || duplicateDisabled}
            onClick={() => setMenuOpen((prev) => !prev)}
            title="More actions"
            type="button"
          >
            <Ellipsis size={16} strokeWidth={2} />
          </button>
          {menuOpen && (
            <div className="my-events-menu">
              <button
                className="my-events-menu-item"
                disabled={duplicateDisabled}
                onClick={() => { setMenuOpen(false); setConfirmAction("duplicate"); }}
                type="button"
              >
                Duplicate Event
              </button>
              {event.status === "cancelled" ? (
                <button
                  className="my-events-menu-item"
                  disabled={republishDisabled}
                  onClick={() => { setMenuOpen(false); setConfirmAction("republish"); }}
                  type="button"
                >
                  Republish
                </button>
              ) : (
                <button
                  className="my-events-menu-item"
                  disabled={cancelDisabled}
                  onClick={() => { setMenuOpen(false); setConfirmAction("cancel"); }}
                  type="button"
                >
                  Cancel
                </button>
              )}
              <button
                className="my-events-menu-item danger"
                disabled={discardDisabled}
                onClick={() => { setMenuOpen(false); setConfirmAction("discard"); }}
                type="button"
              >
                Discard
              </button>
            </div>
          )}
        </div>
      </div>
      <h3>{event.name}</h3>
      <p className="my-events-mobile-meta">
        <CalendarDays size={14} strokeWidth={1.8} />
        {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {timeLabel}
      </p>
      <p className="my-events-mobile-meta">
        <MapPin size={14} strokeWidth={1.8} />
        {event.location}
      </p>
      <div className="my-events-registrations-row">
        <p className="my-events-col-label">Registrations</p>
        <p className={`my-events-capacity ${warn ? "warn" : ""}`}>
          {event.registeredCount}/{event.capacity}
          {warn ? " · almost full" : ""}
        </p>
      </div>
      <div className="progress-track event-card-progress">
        <div
          className={`progress-fill ${warn ? "warn" : ""}`}
          style={{ width: `${Math.min(ratio * 100, 100)}%` }}
        />
      </div>

      <div className={styles.actions}>
        <Link className="btn btn-secondary" to={`/events/${event._id}`}>
          View
        </Link>
        <Link className="btn btn-secondary" to={`/events/${event._id}/edit`}>
          Edit
        </Link>
      </div>
      <ConfirmDialog
        confirmDisabled={
          confirmAction === "duplicate"
            ? duplicateDisabled
            : confirmAction === "cancel"
              ? cancelDisabled
              : confirmAction === "republish"
                ? republishDisabled
                : discardDisabled
        }
        confirmLabel={
          confirmAction === "duplicate"
            ? "Duplicate Event"
            : confirmAction === "cancel"
              ? "Cancel Event"
              : confirmAction === "republish"
                ? "Republish Event"
                : "Discard Event"
        }
        danger={confirmAction === "discard"}
        message={
          confirmAction === "duplicate"
            ? "This will create a copy of this event with the same details."
            : confirmAction === "cancel"
              ? "This will cancel the event and move it to Cancelled."
              : confirmAction === "republish"
                ? "This will move the event back to Published."
                : "This action permanently removes the event and cannot be undone."
        }
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction === "duplicate") onDuplicate(event);
          else if (confirmAction === "cancel") onCancel(event._id);
          else if (confirmAction === "republish") onRepublish(event._id);
          else if (confirmAction === "discard") onDiscard(event._id);
          setConfirmAction(null);
        }}
        open={Boolean(confirmAction)}
        title={
          confirmAction === "duplicate"
            ? "Duplicate event?"
            : confirmAction === "cancel"
              ? "Cancel event?"
              : confirmAction === "republish"
                ? "Republish event?"
                : "Discard event?"
        }
      />
    </article>
  );
};
