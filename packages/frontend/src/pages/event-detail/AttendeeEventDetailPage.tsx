import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { Event, User } from "@event-platform/shared";
import { cancelRegistrationRequest, listMyRegistrationsRequest, registerForEventRequest } from "../../api/registrations";
import { MarkdownContent } from "../../components/markdown-content";
import { CategoryChip } from "../../components/category-chip";
import pageStyles from "./styles.module.css";
import { resolveAttendeeRegistrationCta } from "./attendeeRegistrationCta";
import type { DetailMetaItem } from "./types";

export interface AttendeeEventDetailPageProps {
  id: string;
  user: User | null;
  event: Event;
  organizerName: string;
  ratio: number;
  hostInitials: string;
  detailMetaItems: DetailMetaItem[];
}

export const AttendeeEventDetailPage = ({
  id,
  user,
  event,
  organizerName,
  ratio,
  hostInitials,
  detailMetaItems
}: AttendeeEventDetailPageProps) => {
  const queryClient = useQueryClient();
  const registrationBucket = new Date(event.date).getTime() < Date.now() ? "past" : "upcoming";
  const myRegsQuery = useQuery({
    queryKey: ["my-registrations", registrationBucket, "detail-check"],
    queryFn: () => listMyRegistrationsRequest({ bucket: registrationBucket, limit: 50 }),
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
  const isPast = registrationBucket === "past";
  const isFull = event.registeredCount >= event.capacity;

  const cta = resolveAttendeeRegistrationCta({
    user,
    event,
    isRegistered,
    isPast,
    isFull,
    onRegister: () => registerMutation.mutate(),
    onCancelRegistration: () => cancelMutation.mutate(),
    registerMutation,
    cancelMutation
  });

  return (
    <main className={`container ${pageStyles.detailPage}`}>
      <section className={`${pageStyles.mobileHeader} only-mobile`}>
        <Link aria-label="Back to events" className={pageStyles.mobileBack} to="/">
          <ChevronLeft size={18} strokeWidth={2} />
        </Link>
        <h2>Event details</h2>
      </section>
      <section className={pageStyles.layout}>
        <article className={`panel ${pageStyles.main}`}>
          <div className={pageStyles.top}>
            <Link className="back-link only-desktop" to="/">
              ← Back to events
            </Link>
            <CategoryChip category={event.category} className={pageStyles.categoryChip} />
          </div>
          <h1>{event.name}</h1>
          <div className={pageStyles.metaGrid}>
            {detailMetaItems.map((item) => (
              <div className={pageStyles.metaEntry} key={item.key}>
                <span className={pageStyles.metaIcon}>{item.icon}</span>
                <div className={pageStyles.metaContent}>
                  <span className={pageStyles.metaLabelText}>{item.label}</span>
                  <p className={pageStyles.metaValue}>{item.value}</p>
                  {item.sub ? <p className={pageStyles.metaSub}>{item.sub}</p> : null}
                </div>
              </div>
            ))}
          </div>
          <div className="divider" />
          <MarkdownContent className={`markdown-content ${pageStyles.aboutMarkdown}`} content={event.description} />
          <div className={pageStyles.mainHostBelowAbout}>
            <div className="divider" />
            <div className="host-row">
              <span className="host-avatar">{hostInitials}</span>
              <div>
                <p className="host-label">Hosted by</p>
                <p className="host-name">{organizerName}</p>
              </div>
            </div>
          </div>
        </article>
        <aside className={`panel ${pageStyles.side}`}>
          <p className={pageStyles.spotsCopy}>
            {event.registeredCount} of {event.capacity} spots
          </p>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${ratio}%` }} />
          </div>
          <button
            className={`btn ${cta.variant === "primary" ? "btn-primary" : "btn-secondary"} ${pageStyles.cta}`}
            disabled={cta.disabled}
            onClick={cta.onPress}
            type="button"
          >
            {cta.label}
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
      <section className={`${pageStyles.mobileActionBar} only-mobile`}>
        <div className={pageStyles.spotsActionRow}>
          <div className={pageStyles.spotsInlineRow}>
            <p className={pageStyles.spotsInlineCopy}>
              {event.registeredCount}/{event.capacity} spots
            </p>
            <div className={`progress-track ${pageStyles.spotsInlineTrack}`}>
              <div className="progress-fill" style={{ width: `${ratio}%` }} />
            </div>
          </div>
          <button
            className={`btn ${cta.variant === "primary" ? "btn-primary" : "btn-secondary"} ${pageStyles.spotsActionBtn}`}
            disabled={cta.disabled}
            onClick={cta.onPress}
            type="button"
          >
            {cta.label}
          </button>
        </div>
      </section>
    </main>
  );
};
