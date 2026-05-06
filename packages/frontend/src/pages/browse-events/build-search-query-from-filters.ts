import type { ParsedFilters } from "../../api/events";
import { formatParsedFilterDate } from "../../utils/format-parsed-filter-date";

export type ChipRemovalKey =
  | "category"
  | "maxCapacity"
  | "minCapacity"
  | "dateFrom"
  | "dateTo"
  | "keywords";

const isFiltersEmpty = (filters: ParsedFilters): boolean =>
  !filters.category &&
  !filters.dateRange.from &&
  !filters.dateRange.to &&
  filters.maxCapacity === null &&
  filters.minCapacity === null &&
  filters.keywords.length === 0;

export const applyChipRemoval = (filters: ParsedFilters, key: ChipRemovalKey): ParsedFilters => {
  const next: ParsedFilters = {
    ...filters,
    dateRange: { ...filters.dateRange }
  };
  switch (key) {
    case "category":
      next.category = null;
      break;
    case "maxCapacity":
      next.maxCapacity = null;
      break;
    case "minCapacity":
      next.minCapacity = null;
      break;
    case "dateFrom":
    case "dateTo":
      next.dateRange = { from: null, to: null };
      break;
    case "keywords":
      next.keywords = [];
      break;
    default:
      break;
  }
  return next;
};

/**
 * Builds natural language suitable for re-parsing: multi-word where possible so AI parsing runs when configured.
 */
export const parsedFiltersToSearchQuery = (filters: ParsedFilters): string => {
  if (isFiltersEmpty(filters)) return "";
  const parts: string[] = [];
  if (filters.category) parts.push(`${filters.category} events`);
  if (filters.dateRange.from && filters.dateRange.to) {
    const from = formatParsedFilterDate(filters.dateRange.from, "searchQuery");
    const to = formatParsedFilterDate(filters.dateRange.to, "searchQuery");
    parts.push(`from ${from} to ${to}`);
  }
  if (filters.minCapacity !== null) parts.push(`more than ${filters.minCapacity} people`);
  if (filters.maxCapacity !== null) parts.push(`under ${filters.maxCapacity} people`);
  if (filters.keywords.length) parts.push(filters.keywords.join(" "));
  return parts.join(" ");
};
