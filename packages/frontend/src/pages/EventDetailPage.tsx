import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { getEventRequest } from "../api/events";
import {
  cancelRegistrationRequest,
  listMyRegistrationsRequest,
  registerForEventRequest
} from "../api/registrations";
import { useAuthStore } from "../stores/auth";

export const EventDetailPage = () => {
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const eventQuery = useQuery({
    queryKey: ["event", id],
    queryFn: () => getEventRequest(id!)
  });

  const myRegsQuery = useQuery({
    queryKey: ["my-registrations"],
    queryFn: listMyRegistrationsRequest,
    enabled: user?.role === "attendee"
  });

  const registerMutation = useMutation({
    mutationFn: () => registerForEventRequest(id!),
    onSuccess: () => {
      toast.success("Registered successfully");
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
    },
    onError: (error) => toast.error(error.message)
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelRegistrationRequest(id!),
    onSuccess: () => {
      toast.success("Registration cancelled");
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
    },
    onError: (error) => toast.error(error.message)
  });

  if (eventQuery.isLoading) {
    return <main className="container"><section className="panel">Loading event...</section></main>;
  }

  if (!eventQuery.data) {
    return <main className="container"><section className="panel">Event not found.</section></main>;
  }

  const event = eventQuery.data.event;
  const isRegistered = Boolean(
    myRegsQuery.data?.data.find((item) => item.event._id === event._id && item.registration.status === "active")
  );
  const isPast = new Date(event.date).getTime() < Date.now();
  const isFull = event.registeredCount >= event.capacity;
  const isHost = user?._id === event.organizerId;

  return (
    <main className="container">
      <section className="detail-layout">
        <article className="panel detail-main">
          <span className="pill">{event.category}</span>
          <h1>{event.name}</h1>
          <p>{event.description}</p>
          <p><strong>When:</strong> {new Date(event.date).toLocaleString()}</p>
          <p><strong>Where:</strong> {event.location}</p>
        </article>
        <aside className="panel detail-side">
          <h3>Registration</h3>
          <p>{event.registeredCount}/{event.capacity} spots filled</p>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${Math.min(100, (event.registeredCount / event.capacity) * 100)}%` }} />
          </div>
          {!user && <button className="btn btn-secondary" disabled type="button">Sign in to register</button>}
          {user && isHost && <button className="btn btn-secondary" disabled type="button">You are hosting this event</button>}
          {user?.role === "attendee" && !isHost && isPast && (
            <button className="btn btn-secondary" disabled type="button">This event has ended</button>
          )}
          {user?.role === "attendee" && !isHost && !isPast && isRegistered && (
            <button className="btn btn-secondary" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate()} type="button">
              {cancelMutation.isPending ? "Cancelling..." : "Cancel registration"}
            </button>
          )}
          {user?.role === "attendee" && !isHost && !isPast && !isRegistered && (
            <button className="btn btn-primary" disabled={isFull || registerMutation.isPending} onClick={() => registerMutation.mutate()} type="button">
              {isFull ? "Event full" : registerMutation.isPending ? "Registering..." : "Register"}
            </button>
          )}
        </aside>
      </section>
    </main>
  );
};
