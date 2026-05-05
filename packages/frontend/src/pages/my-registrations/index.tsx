import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cancelRegistrationRequest, listMyRegistrationsRequest } from "../../api/registrations";
import { LoadingBlocks } from "../../components/loading-blocks";
import { MyRegistrationCard } from "../../components/my-registration-card";
import { PaginationControls } from "../../components/pagination-controls";
import { SegmentedCountTabs } from "../../components/segmented-count-tabs";
import { useAuthStore } from "../../stores/auth";
import styles from "./styles.module.css";

export const MyRegistrationsPage = () => {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [page, setPage] = useState(1);
  const [cursorByPage, setCursorByPage] = useState<Record<number, string | undefined>>({ 1: undefined });

  const regsQuery = useQuery({
    queryKey: ["my-registrations", activeTab, cursorByPage[page]],
    queryFn: () => listMyRegistrationsRequest({ bucket: activeTab, cursor: cursorByPage[page], limit: 6 }),
    enabled: user?.role === "attendee"
  });

  useEffect(() => {
    const nextCursor = regsQuery.data?.pageInfo.nextCursor;
    if (!nextCursor) return;
    setCursorByPage((current) => ({ ...current, [page + 1]: nextCursor }));
  }, [regsQuery.data?.pageInfo.nextCursor, page]);

  const resetPaging = () => {
    setPage(1);
    setCursorByPage({ 1: undefined });
  };

  const cancelMutation = useMutation({
    mutationFn: cancelRegistrationRequest,
    onSuccess: () => {
      toast.success("Registration cancelled");
      queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
    },
    onError: (error) => toast.error(error.message)
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

  const counts = regsQuery.data?.counts ?? { upcoming: 0, past: 0 };
  const visibleRegs = regsQuery.data?.data ?? [];
  const pageCount = regsQuery.data?.pageInfo.hasNextPage ? page + 1 : page;

  return (
    <main className={`container ${styles.page}`}>
      <section className={styles.header}>
        <h1>My registrations</h1>
        <p>Events you've signed up for.</p>
      </section>
      {regsQuery.isLoading ? (
        <LoadingBlocks />
      ) : regsQuery.isError ? (
        <section className="panel">
          <h3>Could not load registrations</h3>
          <p>Please refresh the page and try again.</p>
        </section>
      ) : (
        <section>
          <SegmentedCountTabs
            activeId={activeTab}
            ariaLabel="Registration timeline tabs"
            className={styles.tabs}
            items={[
              { id: "upcoming", label: "Upcoming", count: counts.upcoming },
              { id: "past", label: "Past", count: counts.past }
            ]}
            onChange={(value) => {
              setActiveTab(value);
              resetPaging();
            }}
          />
          {visibleRegs.length ? (
            <section className={styles.grid}>
              {visibleRegs.map(({ registration, event, organizerName }) => (
                <MyRegistrationCard
                  cancelDisabled={cancelMutation.isPending}
                  event={event}
                  key={registration._id}
                  onCancel={(eventId) => cancelMutation.mutate(eventId)}
                  organizerName={organizerName}
                />
              ))}
            </section>
          ) : (
            <article className={`panel ${styles.emptyState}`}>
              <h3>{activeTab === "upcoming" ? "No upcoming registrations" : "No past registrations"}</h3>
              <p>Browse events and register to build your schedule.</p>
            </article>
          )}
          {pageCount > 1 ? (
            <div className={styles.listPagination}>
              <PaginationControls onPageChange={setPage} page={page} pageCount={pageCount} />
            </div>
          ) : null}
        </section>
      )}
    </main>
  );
};
