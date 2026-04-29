import type { Event } from "@event-platform/shared";
import { apiRequest } from "./client";

export interface ParsedFilters {
  category: "tech" | "networking" | "workshop" | "social" | "other" | null;
  dateRange: { from: string | null; to: string | null };
  maxCapacity: number | null;
  minCapacity: number | null;
  keywords: string[];
}

export const parseSearchRequest = (query: string) =>
  apiRequest<{ filters: ParsedFilters; events: Event[]; warning?: string }>("/search/parse", {
    method: "POST",
    body: JSON.stringify({ query })
  });
