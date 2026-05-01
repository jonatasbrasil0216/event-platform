import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { EventCategory } from "@event-platform/shared";
import { listEventsRequest } from "../api/events";
import { CategoryPills } from "../components/CategoryPills";
import { DatePickerButton } from "../components/DatePickerButton";
import { EventCard } from "../components/EventCard";
import { LoadingBlocks } from "../components/LoadingBlocks";
import { ParsedFilterChips } from "../components/ParsedFilterChips";
import { PaginationControls } from "../components/PaginationControls";
import { SearchBox } from "../components/SearchBox";
import styles from "./BrowseEventsPage.module.css";

export const BrowseEventsPage = () => {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | EventCategory>("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [page, setPage] = useState(1);
  const [cursorByPage, setCursorByPage] = useState<Record<number, string | undefined>>({ 1: undefined });

  const eventsQuery = useQuery({
    queryKey: ["events", submittedQuery, activeCategory, selectedDate, cursorByPage[page]],
    queryFn: () =>
      listEventsRequest({
        q: submittedQuery || undefined,
        category: activeCategory === "all" ? undefined : activeCategory,
        date: selectedDate || undefined,
        cursor: cursorByPage[page],
        limit: 12
      })
  });

  useEffect(() => {
    const nextCursor = eventsQuery.data?.pageInfo.nextCursor;
    if (!nextCursor) return;
    setCursorByPage((current) => ({ ...current, [page + 1]: nextCursor }));
  }, [eventsQuery.data?.pageInfo.nextCursor, page]);

  useEffect(() => {
    if (eventsQuery.data?.warning) toast.warning(eventsQuery.data.warning);
  }, [eventsQuery.data?.warning]);

  const resetPaging = () => {
    setPage(1);
    setCursorByPage({ 1: undefined });
  };

  const runSearch = () => {
    const trimmed = query.trim();
    setSubmittedQuery(trimmed);
    resetPaging();
  };

  const removeChip = (
    key: "category" | "maxCapacity" | "minCapacity" | "dateFrom" | "dateTo" | "keywords"
  ) => {
    if (key === "category") setActiveCategory("all");
    if (key === "dateFrom" || key === "dateTo") setSelectedDate("");
    if (key === "maxCapacity" || key === "minCapacity" || key === "keywords") {
      setQuery("");
      setSubmittedQuery("");
    }
    resetPaging();
  };

  const visibleEvents = eventsQuery.data?.data ?? [];
  const pageCount = eventsQuery.data?.pageInfo.hasNextPage ? page + 1 : page;

  return (
    <main className="container">
      <section className={`panel ${styles.shell}`}>
        <div className={styles.titleRow}>
          <h1>Discover events</h1>
        </div>
        <SearchBox
          disabled={eventsQuery.isFetching}
          isLoading={eventsQuery.isFetching}
          onChange={setQuery}
          onSubmit={runSearch}
          placeholder="tech meetups next month under 50 people"
          value={query}
        />
        {eventsQuery.data?.filters && (
          <ParsedFilterChips filters={eventsQuery.data.filters} onRemove={removeChip} />
        )}
        <div className={styles.filtersRow}>
          <CategoryPills
            activeCategory={activeCategory}
            onChange={(value) => {
              setActiveCategory(value);
              resetPaging();
            }}
          />
          <DatePickerButton
            onChange={(value) => {
              setSelectedDate(value);
              resetPaging();
            }}
            value={selectedDate}
          />
        </div>
        <div className="divider" />
      </section>
      {eventsQuery.isLoading ? (
        <LoadingBlocks />
      ) : eventsQuery.isError ? (
        <section className="panel">
          <h3>Could not load events</h3>
          <p>Please refresh the page and try again.</p>
        </section>
      ) : (
        <section className={styles.cardsGrid}>
          {visibleEvents.length ? (
            visibleEvents.map((event) => <EventCard event={event} key={event._id} />)
          ) : (
            <article className="panel">
              <h3>No events published yet</h3>
              <p>Check back soon for upcoming sessions.</p>
            </article>
          )}
          {pageCount > 1 && (
            <div className={styles.listPagination}>
              <PaginationControls
                onPageChange={(nextPage) => {
                  if (nextPage < 1 || nextPage > pageCount) return;
                  setPage(nextPage);
                }}
                page={page}
                pageCount={pageCount}
              />
            </div>
          )}
        </section>
      )}
    </main>
  );
};
