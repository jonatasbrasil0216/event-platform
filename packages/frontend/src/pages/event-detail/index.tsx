import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { getEventRequest } from "../../api/events";
import { useAuthStore } from "../../stores/auth";
import { AttendeeEventDetailPage } from "./AttendeeEventDetailPage";
import { getEventDisplayContext } from "./eventDisplayContext";
import { OrganizerEventDetailPage } from "./OrganizerEventDetailPage";

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
  const ctx = getEventDisplayContext(event, organizerName);
  const isOrganizerView = user?.role === "organizer" && user._id === event.organizerId;

  if (isOrganizerView) {
    return (
      <OrganizerEventDetailPage
        key={id}
        event={event}
        eventDate={ctx.eventDate}
        eventTime={ctx.eventTime}
        id={id}
        ratio={ctx.ratio}
      />
    );
  }

  return (
    <AttendeeEventDetailPage
      detailMetaItems={ctx.detailMetaItems}
      event={event}
      hostInitials={ctx.hostInitials}
      id={id}
      organizerName={organizerName}
      ratio={ctx.ratio}
      user={user}
    />
  );
};
