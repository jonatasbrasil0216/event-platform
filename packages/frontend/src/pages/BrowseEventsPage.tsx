import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { EventCategory } from "@event-platform/shared";
import { listEventsRequest } from "../api/events";
import { type ParsedFilters, parseSearchRequest } from "../api/search";
import { LoadingBlocks } from "../components/LoadingBlocks";

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

  const eventsQuery = useQuery({
    queryKey: ["events"],
    queryFn: listEventsRequest
  });

  const visibleEvents = useMemo(() => {
    const baseEvents = searchEvents ?? eventsQuery.data?.data ?? [];
    if (activeCategory === "all") return baseEvents;
    return baseEvents.filter((event) => event.category === activeCategory);
  }, [activeCategory, eventsQuery.data?.data, searchEvents]);

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
        <div className="search-row">
          <div className="search-input-wrap">
            <span className="search-icon" aria-hidden="true">
              <svg fill="none" height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                <path d="M20 20L17 17" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
              </svg>
            </span>
            <input
              className="search-input"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void runSearch();
                }
              }}
              placeholder="tech meetups next month under 50 people"
              value={query}
            />
            <span className="search-hint">Press ↵</span>
          </div>
        </div>
        {parsedFilters && (
          <div className="understood-row">
            <span>Understood as:</span>
            <div className="chip-wrap">
              {parsedFilters.category && (
                <button className="chip" onClick={() => removeChip("category")} type="button">
                  {parsedFilters.category} ×
                </button>
              )}
              {parsedFilters.maxCapacity !== null && (
                <button className="chip" onClick={() => removeChip("maxCapacity")} type="button">
                  Capacity {"<"} {parsedFilters.maxCapacity} ×
                </button>
              )}
              {parsedFilters.minCapacity !== null && (
                <button className="chip" onClick={() => removeChip("minCapacity")} type="button">
                  Capacity {">"} {parsedFilters.minCapacity} ×
                </button>
              )}
              {parsedFilters.dateRange.from && parsedFilters.dateRange.to && (
                <button className="chip" onClick={() => removeChip("dateFrom")} type="button">
                  {new Date(parsedFilters.dateRange.from).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric"
                  })}{" "}
                  -{" "}
                  {new Date(parsedFilters.dateRange.to).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric"
                  })}{" "}
                  ×
                </button>
              )}
              {parsedFilters.keywords.length > 0 && (
                <button className="chip" onClick={() => removeChip("keywords")} type="button">
                  {parsedFilters.keywords[0]} ×
                </button>
              )}
            </div>
          </div>
        )}
        <div className="filters-row">
          <div className="category-pills">
            {(["all", "tech", "networking", "workshop", "social"] as const).map((category) => (
              <button
                className={`category-pill ${activeCategory === category ? "active" : ""}`}
                key={category}
                onClick={() => setActiveCategory(category)}
                type="button"
              >
                {category === "all" ? "All" : category[0].toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
          <button className="date-filter-btn" type="button">
            Any date
          </button>
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
            visibleEvents.map((event) => (
              <Link className={`event-card ${event.registeredCount >= event.capacity ? "is-full" : ""}`} key={event._id} to={`/events/${event._id}`}>
                <span className="pill">{event.category[0].toUpperCase() + event.category.slice(1)}</span>
                <h3>{event.name}</h3>
                <p className="event-meta">
                  {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} ·{" "}
                  {new Date(event.date).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit"
                  })}
                </p>
                <p className="event-location">{event.location}</p>
                <div className="progress-track thin">
                  <div
                    className={`progress-fill ${event.registeredCount / event.capacity > 0.85 ? "warn" : ""}`}
                    style={{ width: `${Math.min((event.registeredCount / event.capacity) * 100, 100)}%` }}
                  />
                </div>
                <p className={`event-capacity ${event.registeredCount / event.capacity > 0.85 ? "warn" : ""}`}>
                  {event.registeredCount >= event.capacity
                    ? "Full"
                    : event.registeredCount / event.capacity > 0.85
                      ? `${event.registeredCount} / ${event.capacity} · almost full`
                      : `${event.registeredCount} / ${event.capacity} registered`}
                </p>
              </Link>
            ))
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
