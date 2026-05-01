import type { ReactNode } from "react";
import type { PaginatedResponse } from "@event-platform/shared";

export type OrganizersAttendeesPayload = PaginatedResponse<{
  _id: string;
  name: string;
  email: string;
  registeredAt: string;
}> & { total: number };

export type DetailMetaItem = {
  key: string;
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
};
