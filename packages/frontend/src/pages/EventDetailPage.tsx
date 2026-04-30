import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ChevronLeft, Ellipsis, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import type { Event, User } from "@event-platform/shared";
import {
  cancelEventRequest,
  createEventRequest,
  deleteEventRequest,
  getEventRequest,
  makeEventDraftRequest
} from "../api/events";
import {
  cancelRegistrationRequest,
  listEventAttendeesRequest,
  listMyRegistrationsRequest,
  registerForEventRequest
} from "../api/registrations";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { MarkdownContent } from "../components/MarkdownContent";
import { OrganizerAttendeesCard } from "../components/OrganizerAttendeesCard";
import { useAuthStore } from "../stores/auth";
import { getCategoryLabel, getCategoryToneClass } from "../utils/categoryTheme";

type DetailMetaItem = { key: string; icon: ReactNode; label: string; value: string; sub?: string };

const buildDetailMetaItems = (eventDate: string, eventTime: string, location: string): DetailMetaItem[] => [
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

interface OrganizerDetailProps {
  id: string;
  event: Event;
  organizerName: string;
  eventDate: string;
  eventTime: string;
  ratio: number;
}

const OrganizerEventDetailPage = ({ id, event, organizerName, eventDate, eventTime, ratio }: OrganizerDetailProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [attendeeQuery, setAttendeeQuery] = useState("");
  const [sortMode, setSortMode] = useState<"recent" | "oldest">("recent");
  const [desktopPage, setDesktopPage] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"cancel" | "discard" | "duplicate" | "draft" | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const desktopMenuRef = useRef<HTMLDivElement | null>(null);

  const attendeesQuery = useQuery({
    queryKey: ["event-attendees", id],
    queryFn: () => listEventAttendeesRequest(id)
  });
  const cancelEventMutation = useMutation({
    mutationFn: () => cancelEventRequest(id),
    onSuccess: () => {
      toast.success("Event cancelled");
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      queryClient.invalidateQueries({ queryKey: ["my-events"] });
    },
    onError: (error) => toast.error(error.message)
  });
  const discardEventMutation = useMutation({
    mutationFn: () => deleteEventRequest(id),
    onSuccess: () => {
      toast.success("Event discarded");
      queryClient.invalidateQueries({ queryKey: ["my-events"] });
      navigate("/organizer/events");
    },
    onError: (error) => toast.error(error.message)
  });
  const duplicateMutation = useMutation({
    mutationFn: () =>
      createEventRequest({
        name: `${event.name} (Copy)`,
        description: event.description,
        category: event.category,
        date: event.date,
        location: event.location,
        capacity: event.capacity
      }),
    onSuccess: (response) => {
      toast.success("Event duplicated");
      queryClient.invalidateQueries({ queryKey: ["my-events"] });
      navigate(`/events/${response.event._id}`);
    },
    onError: (error) => toast.error(error.message)
  });
  const makeDraftMutation = useMutation({
    mutationFn: () => makeEventDraftRequest(id),
    onSuccess: () => {
      toast.success("Moved to draft");
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      queryClient.invalidateQueries({ queryKey: ["my-events"] });
    },
    onError: (error) => toast.error(error.message)
  });

  useEffect(() => {
    const onOutsideClick = (clickEvent: MouseEvent) => {
      if (!(clickEvent.target instanceof Element)) return;
      const clickedMobileMenu = mobileMenuRef.current?.contains(clickEvent.target) ?? false;
      const clickedDesktopMenu = desktopMenuRef.current?.contains(clickEvent.target) ?? false;
      if (!clickedMobileMenu && !clickedDesktopMenu) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutsideClick);
    return () => {
      document.removeEventListener("mousedown", onOutsideClick);
    };
  }, []);

  const daysUntilEvent = Math.max(
    0,
    Math.ceil((new Date(event.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );
  const attendees = attendeesQuery.data?.data ?? [];
  const sortedFilteredAttendees = useMemo(() => {
    const filtered = attendees.filter(
      (attendee) =>
        attendee.name.toLowerCase().includes(attendeeQuery.toLowerCase()) ||
        attendee.email.toLowerCase().includes(attendeeQuery.toLowerCase())
    );
    return [...filtered].sort((a, b) =>
      sortMode === "recent"
        ? new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
        : new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime()
    );
  }, [attendees, attendeeQuery, sortMode]);
  const desktopPageSize = 5;
  const desktopPageCount = Math.max(1, Math.ceil(sortedFilteredAttendees.length / desktopPageSize));
  const desktopSliceStart = (desktopPage - 1) * desktopPageSize;
  const desktopAttendees = sortedFilteredAttendees.slice(desktopSliceStart, desktopSliceStart + desktopPageSize);

  return (
    <main className="container org-detail-page">
      <section className="org-top">
        <div className="org-mobile-top-row only-mobile">
          <Link aria-label="Back to my events" className="org-mobile-back-link" to="/organizer/events">
            <ChevronLeft size={18} strokeWidth={2} />
            <span>Back to my events</span>
          </Link>
          <div className="org-actions">
            <Link className="btn btn-secondary org-edit-btn" to={`/events/${event._id}/edit`}>
              Edit event
            </Link>
            <div className="my-events-menu-wrap" ref={mobileMenuRef}>
              <button className="my-events-more org-more-btn" onClick={() => setMenuOpen((open) => !open)} type="button">
                <Ellipsis size={17} strokeWidth={2} />
              </button>
              {menuOpen && (
                <div className="my-events-menu">
                  <button className="my-events-menu-item" onClick={() => setConfirmAction("cancel")} type="button">
                    Cancel
                  </button>
                  <button className="my-events-menu-item" onClick={() => setConfirmAction("duplicate")} type="button">
                    Duplicate
                  </button>
                  <button className="my-events-menu-item" onClick={() => setConfirmAction("draft")} type="button">
                    Make it Draft
                  </button>
                  <button className="my-events-menu-item danger" onClick={() => setConfirmAction("discard")} type="button">
                    Discard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <Link className="back-link only-desktop" to="/organizer/events">
          ← Back to my events
        </Link>
        <div className="org-title-row">
          <div>
            <div className="org-title-meta">
              <span className={`pill detail-category-chip category-chip ${getCategoryToneClass(event.category)}`}>
                <span className="category-dot" />
                {getCategoryLabel(event.category)}
              </span>
              <span className={`org-published-dot ${event.status !== "published" ? "muted" : ""}`}>
                ● {event.status[0].toUpperCase() + event.status.slice(1)}
              </span>
            </div>
            <h1>{event.name}</h1>
            <p className="my-events-mobile-meta">
              <CalendarDays size={14} strokeWidth={1.8} />
              {eventDate} · {eventTime}
            </p>
            <p className="my-events-mobile-meta">
              <MapPin size={14} strokeWidth={1.8} />
              {event.location}
            </p>
          </div>
          <div className="org-actions only-desktop">
            <Link className="btn btn-secondary org-edit-btn only-desktop" to={`/events/${event._id}/edit`}>
              Edit event
            </Link>
            <div className="my-events-menu-wrap only-desktop" ref={desktopMenuRef}>
              <button className="my-events-more org-more-btn" onClick={() => setMenuOpen((open) => !open)} type="button">
                <Ellipsis size={17} strokeWidth={2} />
              </button>
              {menuOpen && (
                <div className="my-events-menu">
                  <button className="my-events-menu-item" onClick={() => setConfirmAction("cancel")} type="button">
                    Cancel
                  </button>
                  <button className="my-events-menu-item" onClick={() => setConfirmAction("duplicate")} type="button">
                    Duplicate
                  </button>
                  <button className="my-events-menu-item" onClick={() => setConfirmAction("draft")} type="button">
                    Make it Draft
                  </button>
                  <button className="my-events-menu-item danger" onClick={() => setConfirmAction("discard")} type="button">
                    Discard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="org-layout">
        <div className="org-left">
          <article className="panel org-reg-panel">
            <div className="my-events-registrations-row">
              <p className="my-events-col-label">Registrations</p>
              <p className="my-events-capacity">{Math.round(ratio)}% filled</p>
            </div>
            <h3 className="org-reg-count">
              {event.registeredCount}/{event.capacity}
            </h3>
            <div className="progress-track event-card-progress">
              <div className="progress-fill" style={{ width: `${ratio}%` }} />
            </div>
            <p className="org-reg-sub">{`${Math.round(ratio)}% of capacity filled · ${Math.max(
              event.capacity - event.registeredCount,
              0
            )} spots remaining`}</p>
            <div className="org-reg-grid">
              <div>
                <p className="my-events-col-label">This week</p>
                <p className="org-metric">+{Math.max(1, Math.min(event.registeredCount, 5))}</p>
              </div>
              <div>
                <p className="my-events-col-label">Days until event</p>
                <p className="org-metric">{daysUntilEvent}</p>
              </div>
            </div>
          </article>
          <article className="panel org-about-panel">
            <h3>About this event</h3>
            <MarkdownContent className="markdown-content detail-markdown-content" content={event.description} />
          </article>
        </div>

        <OrganizerAttendeesCard
          attendeeQuery={attendeeQuery}
          attendees={desktopAttendees}
          filteredTotal={sortedFilteredAttendees.length}
          onAttendeeQueryChange={(value) => {
            setAttendeeQuery(value);
            setDesktopPage(1);
          }}
          onPageChange={(nextPage) => setDesktopPage(Math.min(Math.max(nextPage, 1), desktopPageCount))}
          onSortModeChange={(value) => {
            setSortMode(value);
            setDesktopPage(1);
          }}
          page={desktopPage}
          pageCount={desktopPageCount}
          shownCount={desktopAttendees.length}
          sortMode={sortMode}
          total={attendeesQuery.data?.total ?? 0}
        />
      </section>
      <ConfirmDialog
        confirmDisabled={
          confirmAction === "cancel"
            ? cancelEventMutation.isPending
            : confirmAction === "discard"
              ? discardEventMutation.isPending
              : confirmAction === "duplicate"
                ? duplicateMutation.isPending
                : makeDraftMutation.isPending
        }
        confirmLabel={
          confirmAction === "cancel"
            ? "Cancel Event"
            : confirmAction === "discard"
              ? "Discard Event"
              : confirmAction === "duplicate"
                ? "Duplicate Event"
                : "Make it Draft"
        }
        danger={confirmAction === "discard" || confirmAction === "cancel"}
        message={
          confirmAction === "cancel"
            ? "This will cancel the event and move it to Cancelled."
            : confirmAction === "discard"
              ? "This permanently removes the event and cannot be undone."
              : confirmAction === "duplicate"
                ? "This will create a copy of this event with the same details."
                : "This will move the event from Published to Draft."
        }
        onClose={() => {
          setConfirmAction(null);
          setMenuOpen(false);
        }}
        onConfirm={() => {
          if (confirmAction === "cancel") cancelEventMutation.mutate();
          if (confirmAction === "discard") discardEventMutation.mutate();
          if (confirmAction === "duplicate") duplicateMutation.mutate();
          if (confirmAction === "draft") makeDraftMutation.mutate();
          setConfirmAction(null);
          setMenuOpen(false);
        }}
        open={Boolean(confirmAction)}
        title={
          confirmAction === "cancel"
            ? "Cancel event?"
            : confirmAction === "discard"
              ? "Discard event?"
              : confirmAction === "duplicate"
                ? "Duplicate event?"
                : "Make this event draft?"
        }
      />
    </main>
  );
};

interface AttendeeDetailProps {
  id: string;
  user: User | null;
  event: Event;
  organizerName: string;
  ratio: number;
  hostInitials: string;
  detailMetaItems: DetailMetaItem[];
}

const AttendeeEventDetailPage = ({
  id,
  user,
  event,
  organizerName,
  ratio,
  hostInitials,
  detailMetaItems
}: AttendeeDetailProps) => {
  const queryClient = useQueryClient();
  const myRegsQuery = useQuery({
    queryKey: ["my-registrations"],
    queryFn: listMyRegistrationsRequest,
    enabled: user?.role === "attendee"
  });

  const registerMutation = useMutation({
    mutationFn: () => registerForEventRequest(id),
    onSuccess: () => {
      toast.success("Registered successfully");
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
    },
    onError: (error) => toast.error(error.message)
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelRegistrationRequest(id),
    onSuccess: () => {
      toast.success("Registration cancelled");
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
    },
    onError: (error) => toast.error(error.message)
  });

  const isRegistered = Boolean(
    myRegsQuery.data?.data.find((item) => item.event._id === event._id && item.registration.status === "active")
  );
  const isPast = new Date(event.date).getTime() < Date.now();
  const isFull = event.registeredCount >= event.capacity;
  const isHost = user?._id === event.organizerId;

  let actionLabel = "Register";
  let actionDisabled = false;
  let actionVariant: "primary" | "secondary" = "primary";
  let action: (() => void) | undefined = () => registerMutation.mutate();

  if (!user) {
    actionLabel = "Sign in to register";
    actionDisabled = true;
    actionVariant = "secondary";
    action = undefined;
  } else if (isHost) {
    actionLabel = "You're hosting this event";
    actionDisabled = true;
    actionVariant = "secondary";
    action = undefined;
  } else if (user.role !== "attendee") {
    actionLabel = "Attendee access only";
    actionDisabled = true;
    actionVariant = "secondary";
    action = undefined;
  } else if (isPast) {
    actionLabel = "This event has ended";
    actionDisabled = true;
    actionVariant = "secondary";
    action = undefined;
  } else if (isRegistered) {
    actionLabel = cancelMutation.isPending ? "Cancelling..." : "Cancel registration";
    actionDisabled = cancelMutation.isPending;
    actionVariant = "secondary";
    action = () => cancelMutation.mutate();
  } else if (isFull) {
    actionLabel = "Event full";
    actionDisabled = true;
    actionVariant = "secondary";
    action = undefined;
  } else if (registerMutation.isPending) {
    actionLabel = "Registering...";
    actionDisabled = true;
  }

  return (
    <main className="container detail-page">
      <section className="detail-mobile-header only-mobile">
        <Link aria-label="Back to events" className="detail-mobile-back" to="/">
          <ChevronLeft size={18} strokeWidth={2} />
        </Link>
        <h2>Event details</h2>
      </section>
      <section className="detail-layout">
        <article className="panel detail-main">
          <div className="detail-top">
            <Link className="back-link only-desktop" to="/">
              ← Back to events
            </Link>
            <span className={`pill detail-category-chip category-chip ${getCategoryToneClass(event.category)}`}>
              <span className="category-dot" />
              {getCategoryLabel(event.category)}
            </span>
          </div>
          <h1>{event.name}</h1>
          <div className="detail-meta-grid">
            {detailMetaItems.map((item) => (
              <div className="detail-meta-entry" key={item.key}>
                <span className="detail-meta-icon">{item.icon}</span>
                <div className="detail-meta-content">
                  <span className="detail-meta-label-text">{item.label}</span>
                  <p className="detail-meta-value">{item.value}</p>
                  {item.sub && <p className="detail-meta-sub">{item.sub}</p>}
                </div>
              </div>
            ))}
          </div>
          <div className="divider" />
          <MarkdownContent className="markdown-content detail-markdown-content" content={event.description} />
          <div className="divider only-mobile" />
          <div className="host-row only-mobile">
            <span className="host-avatar">{hostInitials}</span>
            <div>
              <p className="host-label">Hosted by</p>
              <p className="host-name">{organizerName}</p>
            </div>
          </div>
        </article>
        <aside className="panel detail-side">
          <h3 className="spots-copy">
            {event.registeredCount} of {event.capacity} spots
          </h3>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${ratio}%` }} />
          </div>
          <button
            className={`btn ${actionVariant === "primary" ? "btn-primary" : "btn-secondary"} detail-cta`}
            disabled={actionDisabled}
            onClick={action}
            type="button"
          >
            {actionLabel}
          </button>
          <div className="divider" />
          <div className="host-row">
            <span className="host-avatar">{hostInitials}</span>
            <div>
              <p className="host-label">Hosted by</p>
              <p className="host-name">{organizerName}</p>
            </div>
          </div>
        </aside>
      </section>
      <section className="mobile-action-bar">
        <div>
          <p className="spots-copy">
            {event.registeredCount}/{event.capacity} spots
          </p>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${ratio}%` }} />
          </div>
        </div>
        <button
          className={`btn ${actionVariant === "primary" ? "btn-primary" : "btn-secondary"} mobile-action-btn`}
          disabled={actionDisabled}
          onClick={action}
          type="button"
        >
          {actionLabel}
        </button>
      </section>
    </main>
  );
};

export const EventDetailPage = () => {
  const { id } = useParams();
  const user = useAuthStore((state) => state.user);
  const eventQuery = useQuery({
    queryKey: ["event", id],
    queryFn: () => getEventRequest(id!)
  });

  if (eventQuery.isLoading) {
    return (
      <main className="container">
        <section className="panel">Loading event...</section>
      </main>
    );
  }

  if (!eventQuery.data || !id) {
    return (
      <main className="container">
        <section className="panel">Event not found.</section>
      </main>
    );
  }

  const event = eventQuery.data.event;
  const organizerName = eventQuery.data.organizerName;
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
  const eventTime = new Date(event.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const detailMetaItems = buildDetailMetaItems(eventDate, eventTime, event.location);
  const isOrganizerView = user?.role === "organizer" && user._id === event.organizerId;

  if (isOrganizerView) {
    return (
      <OrganizerEventDetailPage
        event={event}
        eventDate={eventDate}
        eventTime={eventTime}
        id={id}
        organizerName={organizerName}
        ratio={ratio}
      />
    );
  }

  return (
    <AttendeeEventDetailPage
      detailMetaItems={detailMetaItems}
      event={event}
      hostInitials={hostInitials}
      id={id}
      organizerName={organizerName}
      ratio={ratio}
      user={user}
    />
  );
};
