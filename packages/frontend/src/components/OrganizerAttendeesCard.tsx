import { Search } from "lucide-react";
import { PaginationControls } from "./PaginationControls";

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
    <article className="panel org-attendees">
      <div className="org-attendees-head">
        <h3>Attendees</h3>
        <span>{total} registered</span>
      </div>
      <div className="org-attendees-controls">
        <label className="org-search">
          <Search size={14} strokeWidth={1.8} />
          <input
            onChange={(queryEvent) => onAttendeeQueryChange(queryEvent.target.value)}
            placeholder="Search attendees"
            value={attendeeQuery}
          />
        </label>
        <select
          className="org-sort"
          onChange={(sortEvent) => onSortModeChange(sortEvent.target.value === "oldest" ? "oldest" : "recent")}
          value={sortMode}
        >
          <option value="recent">Recent first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>
      <div className="org-attendees-list">
        {attendees.map((attendee) => (
          <div className="org-attendee-row" key={attendee._id}>
            <span className="host-avatar">{attendee.name.slice(0, 2).toUpperCase()}</span>
            <div>
              <p className="org-attendee-name">{attendee.name}</p>
              <p className="org-attendee-email">{attendee.email}</p>
            </div>
            <span className="org-attendee-date">
              {new Date(attendee.registeredAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
              })}
            </span>
          </div>
        ))}
        <div className="org-pagination">
          <span>{`Showing ${shownCount} of ${filteredTotal}`}</span>
          <PaginationControls onPageChange={onPageChange} page={page} pageCount={pageCount} />
        </div>
      </div>
    </article>
  );
};
