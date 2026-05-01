import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
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
import { PaginationControls } from "../components/PaginationControls";
import { SegmentedCountTabs } from "../components/SegmentedCountTabs";
import { useAuthStore } from "../stores/auth";
import styles from "./MyEventsPage.module.css";

export const MyEventsPage = () => {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"published" | "draft" | "past" | "cancelled">("published");
  const [page, setPage] = useState(1);
  const [cursorByPage, setCursorByPage] = useState<Record<number, string | undefined>>({ 1: undefined });

  const eventsQuery = useQuery({
    queryKey: ["my-events", activeTab, cursorByPage[page]],
    queryFn: () => listMyEventsRequest({ bucket: activeTab, cursor: cursorByPage[page], limit: 6 }),
    enabled: user?.role === "organizer"
  });

  useEffect(() => {
    const nextCursor = eventsQuery.data?.pageInfo.nextCursor;
    if (!nextCursor) return;
    setCursorByPage((current) => ({ ...current, [page + 1]: nextCursor }));
  }, [eventsQuery.data?.pageInfo.nextCursor, page]);

  const resetPaging = () => {
    setPage(1);
    setCursorByPage({ 1: undefined });
  };

  const deleteMutation = useMutation({
    mutationFn: deleteEventRequest,
    onSuccess: () => { toast.success("Event discarded"); queryClient.invalidateQueries({ queryKey: ["my-events"] }); },
    onError: (error) => toast.error(error.message)
  });
  const cancelMutation = useMutation({
    mutationFn: cancelEventRequest,
    onSuccess: () => { toast.success("Event cancelled"); queryClient.invalidateQueries({ queryKey: ["my-events"] }); },
    onError: (error) => toast.error(error.message)
  });
  const republishMutation = useMutation({
    mutationFn: republishEventRequest,
    onSuccess: () => { toast.success("Event republished"); queryClient.invalidateQueries({ queryKey: ["my-events"] }); },
    onError: (error) => toast.error(error.message)
  });
  const duplicateMutation = useMutation({
    mutationFn: createEventRequest,
    onSuccess: () => { toast.success("Event duplicated"); queryClient.invalidateQueries({ queryKey: ["my-events"] }); },
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

  const counts = eventsQuery.data?.counts ?? { published: 0, draft: 0, past: 0, cancelled: 0 };
  const visibleEvents = eventsQuery.data?.data ?? [];
  const pageCount = eventsQuery.data?.pageInfo.hasNextPage ? page + 1 : page;
  const showNewEventCard = activeTab === "published" && counts.published === 0;

  return (
    <main className={`container ${styles.page}`}>
      <section className={styles.head}>
        <div>
          <h1>My events</h1>
          <p>Manage events you're hosting.</p>
        </div>
        <Link className={`btn ${styles.createEventBtn} only-desktop`} to="/events/new">
          <Plus size={16} strokeWidth={2.2} />
          Create event
        </Link>
      </section>

      <section className={styles.tabsWrap}>
        <SegmentedCountTabs
          activeId={activeTab}
          ariaLabel="My events timeline"
          items={[
            { id: "published", label: "Published", count: counts.published },
            { id: "draft", label: "Drafts", count: counts.draft },
            { id: "past", label: "Past", count: counts.past },
            { id: "cancelled", label: "Cancelled", count: counts.cancelled }
          ]}
          onChange={(value) => {
            setActiveTab(value);
            resetPaging();
          }}
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
        <section className={styles.list}>
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
          {showNewEventCard && <NewEventCard />}
          {pageCount > 1 && (
            <div className="flex justify-center mt-4 col-span-full">
              <PaginationControls onPageChange={setPage} page={page} pageCount={pageCount} />
            </div>
          )}
        </section>
      )}

      <Link aria-label="Create event" className={`${styles.fab} only-mobile`} to="/events/new">
        <Plus size={22} strokeWidth={2.2} />
      </Link>
    </main>
  );
};
