import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { EventCategory } from "@event-platform/shared";
import { listEventsRequest } from "../api/events";
import { type ParsedFilters, parseSearchRequest } from "../api/search";
import { CategoryPills } from "../components/CategoryPills";
import { DatePickerButton } from "../components/DatePickerButton";
import { EventCard } from "../components/EventCard";
import { LoadingBlocks } from "../components/LoadingBlocks";
import { ParsedFilterChips } from "../components/ParsedFilterChips";
import { SearchBox } from "../components/SearchBox";

const applyFiltersLocally = (
  events: Awaited<ReturnType<typeof listEventsRequest>>["data"],
  filters: ParsedFilters
) => {
  return events.filter((event) => {
    if (filters.category && event.category !== filters.category) return false;
    if (filters.maxCapacity !== null && event.capacity > filters.maxCapacity) return false;
    if (filters.minCapacity !== null && event.capacity < filters.minCapacity) return false;
    if (filters.dateRange.from && new Date(event.date) < new Date(filters.dateRange.from)) return false;
    if (filters.dateRange.to && new Date(event.date) > new Date(filters.dateRange.to)) return false;
    if (filters.keywords.length) {
      const text = `${event.name} ${event.description} ${event.location}`.toLowerCase();
      const keywordHit = filters.keywords.some((k) => text.includes(k.toLowerCase()));
      if (!keywordHit) return false;
    }
    return true;
  });
};

export const BrowseEventsPage = () => {
  const [query, setQuery] = useState("");
  const [parsedFilters, setParsedFilters] = useState<ParsedFilters | null>(null);
  const [searchEvents, setSearchEvents] = useState<Awaited<ReturnType<typeof listEventsRequest>>["data"] | null>(null);
  const [activeCategory, setActiveCategory] = useState<"all" | EventCategory>("all");
  const [selectedDate, setSelectedDate] = useState("");

  const eventsQuery = useQuery({
    queryKey: ["events"],
    queryFn: listEventsRequest
  });

  const visibleEvents = useMemo(() => {
    const baseEvents = searchEvents ?? eventsQuery.data?.data ?? [];
    const categoryFiltered =
      activeCategory === "all" ? baseEvents : baseEvents.filter((event) => event.category === activeCategory);

    if (!selectedDate) {
      return categoryFiltered;
    }

    return categoryFiltered.filter((event) => {
      const eventDate = new Date(event.date);
      const yyyy = eventDate.getFullYear();
      const mm = String(eventDate.getMonth() + 1).padStart(2, "0");
      const dd = String(eventDate.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}` === selectedDate;
    });
  }, [activeCategory, eventsQuery.data?.data, searchEvents, selectedDate]);

  const runSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      setParsedFilters(null);
      setSearchEvents(null);
      return;
    }
    try {
      const result = await parseSearchRequest(trimmed);
      setParsedFilters(result.filters);
      setSearchEvents(result.events);
      if (result.warning) toast.warning(result.warning);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Search failed");
    }
  };

  const removeChip = (key: "category" | "maxCapacity" | "minCapacity" | "dateFrom" | "dateTo" | "keywords") => {
    if (!parsedFilters) return;
    const updated: ParsedFilters = {
      ...parsedFilters,
      dateRange: { ...parsedFilters.dateRange }
    };
    if (key === "category") updated.category = null;
    if (key === "maxCapacity") updated.maxCapacity = null;
    if (key === "minCapacity") updated.minCapacity = null;
    if (key === "dateFrom") updated.dateRange.from = null;
    if (key === "dateTo") updated.dateRange.to = null;
    if (key === "keywords") updated.keywords = [];
    setParsedFilters(updated);
    setSearchEvents(applyFiltersLocally(eventsQuery.data?.data ?? [], updated));
  };

  return (
    <main className="container">
      <section className="panel browse-shell">
        <div className="section-header browse-title-row">
          <h1>Discover events</h1>
        </div>
        <SearchBox
          onChange={setQuery}
          onSubmit={() => {
            void runSearch();
          }}
          placeholder="tech meetups next month under 50 people"
          value={query}
        />
        {parsedFilters && (
          <ParsedFilterChips filters={parsedFilters} onRemove={removeChip} />
        )}
        <div className="filters-row">
          <CategoryPills activeCategory={activeCategory} onChange={setActiveCategory} />
          <DatePickerButton onChange={setSelectedDate} value={selectedDate} />
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
        <section className="cards-grid">
          {visibleEvents.length ? (
            visibleEvents.map((event) => <EventCard event={event} key={event._id} />)
          ) : (
            <article className="panel">
              <h3>No events published yet</h3>
              <p>Check back soon for upcoming sessions.</p>
            </article>
          )}
        </section>
      )}
    </main>
  );
};
