import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  cancelEventRequest,
  createEventRequest,
  deleteEventRequest,
  listMyEventsRequest,
  republishEventRequest
} from "../api/events";
import { LoadingBlocks } from "../components/LoadingBlocks";
import { MyEventCard } from "../components/MyEventCard";
import { NewEventCard } from "../components/NewEventCard";
import { SegmentedCountTabs } from "../components/SegmentedCountTabs";
import { useAuthStore } from "../stores/auth";

export const MyEventsPage = () => {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"published" | "draft" | "past" | "cancelled">("published");

  const eventsQuery = useQuery({
    queryKey: ["my-events"],
    queryFn: listMyEventsRequest,
    enabled: user?.role === "organizer"
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEventRequest,
    onSuccess: () => {
      toast.success("Event discarded");
      queryClient.invalidateQueries({ queryKey: ["my-events"] });
    },
    onError: (error) => toast.error(error.message)
  });
  const cancelMutation = useMutation({
    mutationFn: cancelEventRequest,
    onSuccess: () => {
      toast.success("Event cancelled");
      queryClient.invalidateQueries({ queryKey: ["my-events"] });
    },
    onError: (error) => toast.error(error.message)
  });
  const republishMutation = useMutation({
    mutationFn: republishEventRequest,
    onSuccess: () => {
      toast.success("Event republished");
      queryClient.invalidateQueries({ queryKey: ["my-events"] });
    },
    onError: (error) => toast.error(error.message)
  });
  const duplicateMutation = useMutation({
    mutationFn: createEventRequest,
    onSuccess: () => {
      toast.success("Event duplicated");
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

  const allEvents = eventsQuery.data?.data ?? [];
  const now = Date.now();
  const cancelledEvents = useMemo(() => allEvents.filter((event) => event.status === "cancelled"), [allEvents]);
  const draftEvents = useMemo(() => allEvents.filter((event) => event.status === "draft"), [allEvents]);
  const pastEvents = useMemo(
    () =>
      allEvents.filter(
        (event) =>
          event.status !== "cancelled" &&
          event.status !== "draft" &&
          (new Date(event.date).getTime() < now || event.status === "completed")
      ),
    [allEvents, now]
  );
  const publishedEvents = useMemo(
    () =>
      allEvents.filter(
        (event) =>
          event.status === "published" &&
          new Date(event.date).getTime() >= now
      ),
    [allEvents, now]
  );
  const visibleEvents =
    activeTab === "published"
      ? publishedEvents
      : activeTab === "draft"
        ? draftEvents
        : activeTab === "past"
          ? pastEvents
          : cancelledEvents;

  return (
    <main className="container my-events-page">
      <section className="my-events-head">
        <div>
          <h1>My events</h1>
          <p>Manage events you're hosting.</p>
        </div>
        <Link className="btn btn-create-event only-desktop" to="/events/new">
          <Plus size={16} strokeWidth={2.2} />
          Create event
        </Link>
      </section>

      <section className="my-events-tabs-wrap">
        <SegmentedCountTabs
          activeId={activeTab}
          ariaLabel="My events timeline"
          className="my-events-tabs"
          items={[
            { id: "published", label: "Published", count: publishedEvents.length },
            { id: "draft", label: "Drafts", count: draftEvents.length },
            { id: "past", label: "Past", count: pastEvents.length },
            { id: "cancelled", label: "Cancelled", count: cancelledEvents.length }
          ]}
          onChange={setActiveTab}
        />
      </section>

      {eventsQuery.isLoading ? (
        <LoadingBlocks />
      ) : eventsQuery.isError ? (
        <section className="panel">
          <h3>Could not load events</h3>
          <p>Please refresh the page and try again.</p>
        </section>
      ) : (
        <section className="my-events-list">
          {visibleEvents.length ? (
            visibleEvents.map((event) => (
              <MyEventCard
                cancelDisabled={cancelMutation.isPending}
                republishDisabled={republishMutation.isPending}
                discardDisabled={deleteMutation.isPending}
                duplicateDisabled={duplicateMutation.isPending}
                event={event}
                key={event._id}
                onCancel={(eventId) => cancelMutation.mutate(eventId)}
                onRepublish={(eventId) => republishMutation.mutate(eventId)}
                onDiscard={(eventId) => deleteMutation.mutate(eventId)}
                onDuplicate={(sourceEvent) =>
                  duplicateMutation.mutate({
                    name: `${sourceEvent.name} (Copy)`,
                    description: sourceEvent.description,
                    category: sourceEvent.category,
                    date: sourceEvent.date,
                    location: sourceEvent.location,
                    capacity: sourceEvent.capacity
                  })
                }
              />
            ))
          ) : (
            <article className="panel">
              <h3>
                {activeTab === "published"
                  ? "No published events"
                  : activeTab === "draft"
                    ? "No draft events"
                    : activeTab === "past"
                    ? "No past events"
                    : "No cancelled events"}
              </h3>
              <p>
                {activeTab === "published"
                  ? "Create and publish your first event to start accepting registrations."
                  : activeTab === "draft"
                    ? "You don't have any draft events right now."
                    : activeTab === "past"
                      ? "Your completed events will appear here."
                      : "Cancelled events will appear here."}
              </p>
            </article>
          )}
          {(activeTab === "published" || activeTab === "draft") && <NewEventCard />}
        </section>
      )}

      <Link aria-label="Create event" className="my-events-fab only-mobile" to="/events/new">
        <Plus size={22} strokeWidth={2.2} />
      </Link>
    </main>
  );
};
