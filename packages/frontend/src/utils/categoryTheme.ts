import type { EventCategory } from "@event-platform/shared";

type CategoryTheme = {
  label: string;
  color: string;
  bg: string;
  text: string;
};

export const CATEGORY_THEME: Record<EventCategory, CategoryTheme> = {
  tech: { label: "Tech", color: "#7b73ff", bg: "rgba(123, 115, 255, 0.2)", text: "#dcd8ff" },
  networking: { label: "Networking", color: "#26c39c", bg: "rgba(38, 195, 156, 0.2)", text: "#c6f3e7" },
  workshop: { label: "Workshop", color: "#f0b25d", bg: "rgba(240, 178, 93, 0.2)", text: "#ffe6bf" },
  social: { label: "Social", color: "#6ba6ff", bg: "rgba(107, 166, 255, 0.2)", text: "#cfe3ff" },
  other: { label: "Other", color: "#98a4b8", bg: "rgba(152, 164, 184, 0.22)", text: "#dce3ef" }
};

export const getCategoryLabel = (category: EventCategory) => CATEGORY_THEME[category].label;

export const getCategoryToneClass = (category: EventCategory) => `category-tone-${category}`;
