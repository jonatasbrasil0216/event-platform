import { useQuery } from "@tanstack/react-query";

import { listEventAttendeesRequest } from "../../api/registrations";
import { ATTENDEES_PAGE_SIZE } from "./constants";
import type { OrganizersAttendeesPayload } from "./types";

type SortMode = "recent" | "oldest";

type AttendeesQueryKey = [string, string, string, SortMode, number];

export const useOrganizerEventAttendeesQuery = (
  id: string,
  debouncedAttendeeQuery: string,
  sortMode: SortMode,
  desktopPage: number
) =>
  useQuery<OrganizersAttendeesPayload, Error, OrganizersAttendeesPayload, AttendeesQueryKey>({
    queryKey: ["event-attendees", id, debouncedAttendeeQuery, sortMode, desktopPage],
    placeholderData: (previousData, previousQuery) => {
      const key = previousQuery?.queryKey;
      if (
        previousData !== undefined &&
        Array.isArray(key) &&
        key[0] === "event-attendees" &&
        key[1] === id &&
        key[2] === debouncedAttendeeQuery &&
        key[3] === sortMode
      ) {
        return previousData;
      }
      return undefined;
    },
    queryFn: () =>
      listEventAttendeesRequest(id, {
        q: debouncedAttendeeQuery || undefined,
        sort: sortMode,
        page: desktopPage,
        limit: ATTENDEES_PAGE_SIZE
      })
  });
