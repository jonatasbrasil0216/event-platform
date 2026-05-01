import type { Event, EventCategory } from "@event-platform/shared";
import { ObjectId } from "mongodb";

export interface EventDoc {
  _id: ObjectId;
  organizerId: ObjectId;
  name: string;
  description: string;
  category: EventCategory;
  date: Date;
  location: string;
  capacity: number;
  registeredCount: number;
  status: "draft" | "published" | "cancelled" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

export const toEvent = (doc: EventDoc): Event => ({
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
