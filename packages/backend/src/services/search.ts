import { parsedSearchFiltersSchema, parseSearchQuerySchema, type Event } from "@event-platform/shared";
import { type Collection } from "mongodb";
import { z } from "zod";
import { getOpenAIClient } from "../ai/openai";
import { getDb } from "../db/client";
import { validationError } from "../lib/errors";

interface EventDoc {
  _id: { toString: () => string };
  organizerId: { toString: () => string };
  name: string;
  description: string;
  category: "tech" | "networking" | "workshop" | "social" | "other";
  date: Date;
  location: string;
  capacity: number;
  registeredCount: number;
  status: "published" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const eventsCollection = async (): Promise<Collection<EventDoc>> => {
  const db = await getDb();
  return db.collection<EventDoc>("events");
};

const toEvent = (doc: EventDoc): Event => ({
  _id: doc._id.toString(),
  organizerId: doc.organizerId.toString(),
  name: doc.name,
  description: doc.description,
  category: doc.category,
  date: doc.date.toISOString(),
  location: doc.location,
  capacity: doc.capacity,
  registeredCount: doc.registeredCount,
  status: doc.status,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString()
});

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

const applyFilters = async (filters: z.infer<typeof parsedSearchFiltersSchema>): Promise<Event[]> => {
  const events = await eventsCollection();
  const mongoFilter = buildSearchMongoFilter(filters);

  let docs = await events.find(mongoFilter).sort({ date: 1 }).limit(50).toArray();

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
  if (!parsed.success) {
    throw validationError("Invalid search payload", parsed.error.flatten());
  }

  const query = parsed.data.query.trim();
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

  const events = await applyFilters(filters);
  return { filters, events, warning };
};
