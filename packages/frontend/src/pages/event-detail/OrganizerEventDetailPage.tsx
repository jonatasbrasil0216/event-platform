import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ChevronLeft, Ellipsis, MapPin } from "lucide-react";
import type { RefObject } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { Event } from "@event-platform/shared";
import {
  cancelEventRequest,
  createEventRequest,
  deleteEventRequest,
  makeEventDraftRequest
} from "../../api/events";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { MarkdownContent } from "../../components/MarkdownContent";
import { OrganizerAttendeesCard } from "../../components/OrganizerAttendeesCard";
import { CategoryChip } from "../../components/CategoryChip";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import pageStyles from "./EventDetailPage.module.css";
import { ATTENDEE_SEARCH_DEBOUNCE_MS, ATTENDEES_PAGE_SIZE } from "./constants";
import {
  getOrganizerConfirmCopy,
  isOrganizerConfirmPending,
  type OrganizerConfirmAction
} from "./organizerConfirm";
import { useOrganizerEventAttendeesQuery } from "./useOrganizerEventAttendeesQuery";

const OVERFLOW_MENU_ITEMS: readonly { action: OrganizerConfirmAction; label: string; danger?: boolean }[] = [
  { action: "cancel", label: "Cancel" },
  { action: "duplicate", label: "Duplicate" },
  { action: "draft", label: "Make it Draft" },
  { action: "discard", label: "Discard", danger: true }
];

const OrganizerOverflowMenu = ({
  className,
  menuOpen,
  menuRef,
  onPick,
  onToggleMenu
}: {
  className?: string;
  menuOpen: boolean;
  menuRef: RefObject<HTMLDivElement | null>;
  onPick: (action: OrganizerConfirmAction) => void;
  onToggleMenu: () => void;
}) => (
  <div className={className} ref={menuRef}>
    <button className={pageStyles.orgMoreBtn} onClick={onToggleMenu} type="button">
      <Ellipsis size={17} strokeWidth={2} />
    </button>
    {menuOpen ? (
      <div className="my-events-menu">
        {OVERFLOW_MENU_ITEMS.map((item) => (
          <button
            className={item.danger ? "my-events-menu-item danger" : "my-events-menu-item"}
            key={item.action}
            onClick={() => onPick(item.action)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
    ) : null}
  </div>
);

export interface OrganizerEventDetailPageProps {
  id: string;
  event: Event;
  eventDate: string;
  eventTime: string;
  ratio: number;
}

export const OrganizerEventDetailPage = ({
  id,
  event,
  eventDate,
  eventTime,
  ratio
}: OrganizerEventDetailPageProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [attendeeQuery, setAttendeeQuery] = useState("");
  const debouncedAttendeeQuery = useDebouncedValue(attendeeQuery.trim(), ATTENDEE_SEARCH_DEBOUNCE_MS);
  const [sortMode, setSortMode] = useState<"recent" | "oldest">("recent");
  const [desktopPage, setDesktopPage] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<OrganizerConfirmAction | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const desktopMenuRef = useRef<HTMLDivElement | null>(null);
  const attendeesSectionRef = useRef<HTMLDivElement | null>(null);
  const skipAttendeeScrollRef = useRef(true);

  const attendeesQuery = useOrganizerEventAttendeesQuery(
    id,
    debouncedAttendeeQuery,
    sortMode,
    desktopPage
  );

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

  const mutationPack = {
    cancel: cancelEventMutation,
    discard: discardEventMutation,
    duplicate: duplicateMutation,
    draft: makeDraftMutation
  };

  useEffect(() => {
    const onOutsideClick = (clickEvent: MouseEvent) => {
      if (!(clickEvent.target instanceof Element)) return;
      const clickedMobileMenu = mobileMenuRef.current?.contains(clickEvent.target) ?? false;
      const clickedDesktopMenu = desktopMenuRef.current?.contains(clickEvent.target) ?? false;
      if (!clickedMobileMenu && !clickedDesktopMenu) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  useLayoutEffect(() => {
    if (skipAttendeeScrollRef.current) {
      skipAttendeeScrollRef.current = false;
      return;
    }
    attendeesSectionRef.current?.scrollIntoView({ behavior: "auto", block: "nearest", inline: "nearest" });
  }, [desktopPage]);

  const resetAttendeePaging = () => {
    skipAttendeeScrollRef.current = true;
    setDesktopPage(1);
  };

  const daysUntilEvent = Math.max(
    0,
    Math.ceil((new Date(event.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );
  const desktopAttendees = attendeesQuery.data?.data ?? [];
  const attendeeTotal = attendeesQuery.data?.total ?? 0;
  const desktopPageCount =
    attendeeTotal > 0 ? Math.max(1, Math.ceil(attendeeTotal / ATTENDEES_PAGE_SIZE)) : 1;

  useEffect(() => {
    setDesktopPage((current) => Math.min(current, desktopPageCount));
  }, [desktopPageCount]);

  useEffect(() => {
    skipAttendeeScrollRef.current = true;
    setDesktopPage(1);
  }, [id]);

  useEffect(() => {
    skipAttendeeScrollRef.current = true;
    setDesktopPage(1);
  }, [debouncedAttendeeQuery]);

  const closeConfirmAndMenu = () => {
    setConfirmAction(null);
    setMenuOpen(false);
  };

  const confirmCopy =
    confirmAction !== null ? getOrganizerConfirmCopy(confirmAction) : null;

  return (
    <main className={`container ${pageStyles.orgPage}`}>
      <section className={pageStyles.orgTop}>
        <div className={`${pageStyles.orgMobileTopRow} only-mobile`}>
          <Link aria-label="Back to my events" className={pageStyles.orgMobileBackLink} to="/organizer/events">
            <ChevronLeft size={18} strokeWidth={2} />
            <span>Back to my events</span>
          </Link>
          <div className={pageStyles.orgActions}>
            <Link className={`btn btn-secondary ${pageStyles.orgEditBtn}`} to={`/events/${event._id}/edit`}>
              Edit event
            </Link>
            <OrganizerOverflowMenu
              className="my-events-menu-wrap"
              menuOpen={menuOpen}
              menuRef={mobileMenuRef}
              onPick={(action) => setConfirmAction(action)}
              onToggleMenu={() => setMenuOpen((open) => !open)}
            />
          </div>
        </div>
        <Link className="back-link only-desktop" to="/organizer/events">
          ← Back to my events
        </Link>
        <div className={pageStyles.orgTitleRow}>
          <div>
            <div className={pageStyles.orgTitleMeta}>
              <CategoryChip category={event.category} />
              <span
                className={`${pageStyles.orgPublishedDot} ${event.status !== "published" ? pageStyles.muted : ""}`}
              >
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
          <div className={`${pageStyles.orgActions} only-desktop`}>
            <Link className={`btn btn-secondary ${pageStyles.orgEditBtn} only-desktop`} to={`/events/${event._id}/edit`}>
              Edit event
            </Link>
            <OrganizerOverflowMenu
              className="my-events-menu-wrap only-desktop"
              menuOpen={menuOpen}
              menuRef={desktopMenuRef}
              onPick={(action) => setConfirmAction(action)}
              onToggleMenu={() => setMenuOpen((open) => !open)}
            />
          </div>
        </div>
      </section>

      <section className={pageStyles.orgLayout}>
        <div className={pageStyles.orgLeft}>
          <article className={`panel ${pageStyles.orgRegPanel}`}>
            <div className="my-events-registrations-row">
              <p className="my-events-col-label">Registrations</p>
              <p className="my-events-capacity">{Math.round(ratio)}% filled</p>
            </div>
            <h3 className={pageStyles.orgRegCount}>
              {event.registeredCount}/{event.capacity}
            </h3>
            <div className="progress-track event-card-progress">
              <div className="progress-fill" style={{ width: `${ratio}%` }} />
            </div>
            <p className={pageStyles.orgRegSub}>{`${Math.round(ratio)}% of capacity filled · ${Math.max(event.capacity - event.registeredCount, 0)} spots remaining`}</p>
            <div className={pageStyles.orgRegGrid}>
              <div>
                <p className="my-events-col-label">This week</p>
                <p className={pageStyles.orgMetric}>+{Math.max(1, Math.min(event.registeredCount, 5))}</p>
              </div>
              <div>
                <p className="my-events-col-label">Days until event</p>
                <p className={pageStyles.orgMetric}>{daysUntilEvent}</p>
              </div>
            </div>
          </article>
          <article className={`panel ${pageStyles.orgAboutPanel}`}>
            <h3>About this event</h3>
            <div className="divider" />
            <MarkdownContent className="markdown-content" content={event.description} />
          </article>
        </div>

        <div ref={attendeesSectionRef}>
          <OrganizerAttendeesCard
            attendeeQuery={attendeeQuery}
            attendees={desktopAttendees}
            filteredTotal={attendeeTotal}
            onAttendeeQueryChange={setAttendeeQuery}
            onPageChange={(nextPage) =>
              setDesktopPage(Math.min(Math.max(nextPage, 1), desktopPageCount))
            }
            onSortModeChange={(value) => {
              setSortMode(value);
              resetAttendeePaging();
            }}
            page={Math.min(desktopPage, desktopPageCount)}
            pageCount={desktopPageCount}
            shownCount={desktopAttendees.length}
            sortMode={sortMode}
            total={attendeeTotal}
          />
        </div>
      </section>
      <ConfirmDialog
        confirmDisabled={
          confirmAction !== null ? isOrganizerConfirmPending(confirmAction, mutationPack) : false
        }
        confirmLabel={confirmCopy?.confirmLabel ?? ""}
        danger={confirmCopy?.danger ?? false}
        message={confirmCopy?.message ?? ""}
        onClose={closeConfirmAndMenu}
        onConfirm={() => {
          if (!confirmAction) return;
          if (confirmAction === "cancel") cancelEventMutation.mutate();
          if (confirmAction === "discard") discardEventMutation.mutate();
          if (confirmAction === "duplicate") duplicateMutation.mutate();
          if (confirmAction === "draft") makeDraftMutation.mutate();
          closeConfirmAndMenu();
        }}
        open={confirmAction !== null}
        title={confirmCopy?.title ?? ""}
      />
    </main>
  );
};
