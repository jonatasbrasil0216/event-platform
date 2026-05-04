import { parsedSearchFiltersSchema, parseSearchQuerySchema, type Event as AppEvent } from "@event-platform/shared";
import { z } from "zod";
import { getOpenAIClient } from "../ai/openai";
import { validationError } from "../lib/errors";
import { findEvents, toEvent } from "../repositories/events";

const fallbackFilters = (query: string) => ({
  category: null,
  dateRange: { from: null, to: null },
  maxCapacity: null,
  minCapacity: null,
  keywords: query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2)
});

type ParsedFilters = z.infer<typeof parsedSearchFiltersSchema>;
type SearchMongoFilter = Record<string, unknown>;

export const buildFallbackFilters = (query: string): ParsedFilters => fallbackFilters(query);

export const buildSearchMongoFilter = (filters: ParsedFilters): SearchMongoFilter => {
  const mongoFilter: SearchMongoFilter = { status: "published" };
  if (filters.category) mongoFilter.category = filters.category;
  if (filters.maxCapacity !== null)
    mongoFilter.capacity = { ...(mongoFilter.capacity as object), $lte: filters.maxCapacity };
  if (filters.minCapacity !== null)
    mongoFilter.capacity = { ...(mongoFilter.capacity as object), $gte: filters.minCapacity };
  if (filters.dateRange.from || filters.dateRange.to) {
    mongoFilter.date = {};
    if (filters.dateRange.from) (mongoFilter.date as Record<string, Date>).$gte = new Date(filters.dateRange.from);
    if (filters.dateRange.to) (mongoFilter.date as Record<string, Date>).$lte = new Date(filters.dateRange.to);
  }
  return mongoFilter;
};

const parseWithOpenAI = async (query: string) => {
  const now = new Date().toISOString();
  const openaiClient = getOpenAIClient();
  const completion = await openaiClient.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Extract event search filters from natural language. Current date is " +
          `${now}. Valid categories: tech, networking, workshop, social, other. ` +
          "Return JSON with keys: category, dateRange{from,to}, maxCapacity, minCapacity, keywords. " +
          "Use null for unknown scalar fields and [] for keywords when none."
      },
      { role: "user", content: query }
    ]
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  return parsedSearchFiltersSchema.parse(JSON.parse(raw));
};

export const parseSearchFilters = async (query: string): Promise<{ filters: ParsedFilters; warning?: string }> => {
  let filters: ParsedFilters = buildFallbackFilters(query);
  let warning: string | undefined;

  if (query.split(/\s+/).length > 1) {
    try {
      filters = await Promise.race([
        parseWithOpenAI(query),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000))
      ]);
    } catch {
      warning = "AI parsing unavailable. Showing keyword-based results.";
    }
  }

  return { filters, warning };
};

const applyFilters = async (filters: ParsedFilters): Promise<AppEvent[]> => {
  const mongoFilter = buildSearchMongoFilter(filters);
  let docs = await findEvents(mongoFilter, { sort: { date: 1 }, limit: 50 });

  if (filters.keywords.length) {
    const text = filters.keywords.join(" ").toLowerCase();
    docs = docs.filter(
      (doc) =>
        `${doc.name} ${doc.description} ${doc.location}`.toLowerCase().includes(text) ||
        filters.keywords.some((k) =>
          `${doc.name} ${doc.description} ${doc.location}`.toLowerCase().includes(k.toLowerCase())
        )
    );
  }

  return docs.map(toEvent);
};

export const parseAndSearch = async (input: unknown) => {
  const parsed = parseSearchQuerySchema.safeParse(input);
  if (!parsed.success) throw validationError("Invalid search payload", parsed.error.flatten());

  const query = parsed.data.query.trim();
  const { filters, warning } = await parseSearchFilters(query);

  const events = await applyFilters(filters);
  return { filters, events, warning };
};
