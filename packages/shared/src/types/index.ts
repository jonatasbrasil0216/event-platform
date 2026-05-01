export type UserRole = "organizer" | "attendee";

export type EventCategory = "tech" | "networking" | "workshop" | "social" | "other";

export type EventStatus = "draft" | "published" | "cancelled" | "completed";

export type RegistrationStatus = "active" | "cancelled";

export interface PageInfo {
  nextCursor: string | null;
  hasNextPage: boolean;
  total?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pageInfo: PageInfo;
}

export type OrganizerEventBucket = "published" | "draft" | "past" | "cancelled";
export type RegistrationBucket = "upcoming" | "past";

export interface User {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  _id: string;
  organizerId: string;
  name: string;
  description: string;
  category: EventCategory;
  date: string;
  location: string;
  capacity: number;
  registeredCount: number;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Registration {
  _id: string;
  eventId: string;
  userId: string;
  status: RegistrationStatus;
  registeredAt: string;
  cancelledAt: string | null;
}

export interface ApiError {
  error: {
    code: "VALIDATION_ERROR" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "INTERNAL";
    message: string;
    details?: unknown;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
}
