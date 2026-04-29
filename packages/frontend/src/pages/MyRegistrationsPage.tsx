import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { LoadingBlocks } from "../components/LoadingBlocks";
import { listMyRegistrationsRequest } from "../api/registrations";
import { useAuthStore } from "../stores/auth";

export const MyRegistrationsPage = () => {
  const user = useAuthStore((s) => s.user);
  const regsQuery = useQuery({
    queryKey: ["my-registrations"],
    queryFn: listMyRegistrationsRequest,
    enabled: user?.role === "attendee"
  });

  if (user?.role !== "attendee") {
    return (
      <main className="container">
        <section className="panel">
          <h1>Attendee access only</h1>
          <p>Use an attendee account to view your registrations.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="container">
      <section className="section-header">
        <div>
          <p className="eyebrow">Attendee Dashboard</p>
          <h1>My Registrations</h1>
        </div>
      </section>
      {regsQuery.isLoading ? (
        <LoadingBlocks />
      ) : regsQuery.isError ? (
        <section className="panel">
          <h3>Could not load registrations</h3>
          <p>Please refresh the page and try again.</p>
        </section>
      ) : (
        <section className="event-list">
          {regsQuery.data?.data.length ? (
            regsQuery.data.data.map(({ registration, event }) => (
              <article className="event-row" key={registration._id}>
                <div>
                  <h3>{event.name}</h3>
                  <p>
                    {new Date(event.date).toLocaleString()} - {event.location}
                  </p>
                </div>
                <Link className="btn btn-secondary" to={`/events/${event._id}`}>
                  View
                </Link>
              </article>
            ))
          ) : (
            <article className="panel">
              <h3>No active registrations</h3>
              <p>Browse events and register to build your schedule.</p>
            </article>
          )}
        </section>
      )}
    </main>
  );
};
