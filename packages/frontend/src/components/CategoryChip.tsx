import type { EventCategory } from "@event-platform/shared";
import { getCategoryLabel, getCategoryToneClass } from "../utils/categoryTheme";
import styles from "./CategoryChip.module.css";

interface CategoryChipProps {
  category: EventCategory;
  /** `minimal`: dot + label only (e.g. inside filter buttons). Default: tinted pill. */
  variant?: "default" | "minimal";
  className?: string;
}

/** Category pill with accent dot — uses global tone CSS variables from `styles.css`. */
export const CategoryChip = ({ category, variant = "default", className }: CategoryChipProps) => {
  return (
    <span
      className={[
        styles.root,
        variant === "minimal" ? styles.minimal : "",
        getCategoryToneClass(category),
        className
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={styles.dot} aria-hidden />
      {getCategoryLabel(category)}
    </span>
  );
};
