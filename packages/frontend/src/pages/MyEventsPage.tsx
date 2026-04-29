import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { deleteEventRequest, listMyEventsRequest } from "../api/events";
import { LoadingBlocks } from "../components/LoadingBlocks";
import { useAuthStore } from "../stores/auth";

export const MyEventsPage = () => {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const eventsQuery = useQuery({
    queryKey: ["my-events"],
    queryFn: listMyEventsRequest,
    enabled: user?.role === "organizer"
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEventRequest,
    onSuccess: () => {
      toast.success("Event cancelled");
      queryClient.invalidateQueries({ queryKey: ["my-events"] });
    },
    onError: (error) => toast.error(error.message)
  });

  if (user?.role !== "organizer") {
    return (
      <main className="container">
        <section className="panel">
          <h1>Organizer access only</h1>
          <p>Switch to an organizer account to manage events.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="container">
      <section className="section-header">
        <div>
          <p className="eyebrow">Organizer Dashboard</p>
          <h1>My Events</h1>
        </div>
        <Link className="btn btn-primary" to="/events/new">
          Create Event
        </Link>
      </section>

      {eventsQuery.isLoading ? (
        <LoadingBlocks />
      ) : eventsQuery.isError ? (
        <section className="panel">
          <h3>Could not load events</h3>
          <p>Please refresh the page and try again.</p>
        </section>
      ) : (
        <section className="event-list">
          {eventsQuery.data?.data.length ? (
            eventsQuery.data.data.map((event) => (
              <article className="event-row" key={event._id}>
                <div>
                  <h3>{event.name}</h3>
                  <p>
                    {new Date(event.date).toLocaleString()} - {event.location}
                  </p>
                  <small>
                    {event.registeredCount}/{event.capacity} registered - {event.status}
                  </small>
                </div>
                <div className="row-actions">
                  <Link className="btn btn-secondary" to={`/events/${event._id}/edit`}>
                    Edit
                  </Link>
                  <button
                    className="btn btn-secondary"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(event._id)}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </article>
            ))
          ) : (
            <article className="panel">
              <h3>No events yet</h3>
              <p>Create your first event to start accepting registrations.</p>
            </article>
          )}
        </section>
      )}
    </main>
  );
};
