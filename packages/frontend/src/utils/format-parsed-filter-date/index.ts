/**
 * Parsed search date boundaries come back as full ISO datetimes (often UTC midnight).
 * Format using the UTC calendar date so "May 5" does not become "May 4" in negative-offset timezones.
 */
export const formatParsedFilterDate = (
  iso: string,
  preset: "chip" | "searchQuery"
): string => {
  const options: Intl.DateTimeFormatOptions =
    preset === "chip"
      ? { month: "short", day: "numeric", timeZone: "UTC" }
      : { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" };
  return new Date(iso).toLocaleDateString("en-US", options);
};
