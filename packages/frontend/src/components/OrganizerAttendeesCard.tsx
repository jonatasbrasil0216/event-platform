import { Search } from "lucide-react";
import { PaginationControls } from "./PaginationControls";
import styles from "./OrganizerAttendeesCard.module.css";

export interface OrganizerAttendee {
  _id: string;
  name: string;
  email: string;
  registeredAt: string;
}

interface OrganizerAttendeesCardProps {
  total: number;
  attendeeQuery: string;
  onAttendeeQueryChange: (value: string) => void;
  sortMode: "recent" | "oldest";
  onSortModeChange: (value: "recent" | "oldest") => void;
  attendees: OrganizerAttendee[];
  page: number;
  pageCount: number;
  shownCount: number;
  filteredTotal: number;
  onPageChange: (nextPage: number) => void;
}

export const OrganizerAttendeesCard = ({
  total,
  attendeeQuery,
  onAttendeeQueryChange,
  sortMode,
  onSortModeChange,
  attendees,
  page,
  pageCount,
  shownCount,
  filteredTotal,
  onPageChange
}: OrganizerAttendeesCardProps) => {
  return (
    <article className={`panel ${styles.card}`}>
      <div className={styles.head}>
        <h3>Attendees</h3>
        <span>{total} registered</span>
      </div>
      <div className={styles.controls}>
        <label className={styles.search}>
          <Search size={14} strokeWidth={1.8} />
          <input
            onChange={(queryEvent) => onAttendeeQueryChange(queryEvent.target.value)}
            placeholder="Search attendees"
            value={attendeeQuery}
          />
        </label>
        <select
          className={styles.sort}
          onChange={(sortEvent) =>
            onSortModeChange(sortEvent.target.value === "oldest" ? "oldest" : "recent")
          }
          value={sortMode}
        >
          <option value="recent">Recent first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>
      <div className={styles.list}>
        {attendees.map((attendee) => (
          <div className={styles.attendeeRow} key={attendee._id}>
            <span className="host-avatar">{attendee.name.slice(0, 2).toUpperCase()}</span>
            <div>
              <p className={styles.attendeeName}>{attendee.name}</p>
              <p className={styles.attendeeEmail}>{attendee.email}</p>
            </div>
            <span className={styles.attendeeDate}>
              {new Date(attendee.registeredAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
              })}
            </span>
          </div>
        ))}
        <div className={styles.pagination}>
          <span>{`Showing ${shownCount} of ${filteredTotal}`}</span>
          <PaginationControls onPageChange={onPageChange} page={page} pageCount={pageCount} />
        </div>
      </div>
    </article>
  );
};
