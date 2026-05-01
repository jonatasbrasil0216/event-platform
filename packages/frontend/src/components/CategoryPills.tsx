import type { EventCategory } from "@event-platform/shared";
import { getCategoryToneClass } from "../utils/categoryTheme";
import { CategoryChip } from "./CategoryChip";
import styles from "./CategoryPills.module.css";

interface CategoryPillsProps {
  activeCategory: "all" | EventCategory;
  onChange: (value: "all" | EventCategory) => void;
}

export const CategoryPills = ({ activeCategory, onChange }: CategoryPillsProps) => {
  return (
    <div className={styles.pills}>
      {(["all", "tech", "networking", "workshop", "social"] as const).map((category) => (
        <button
          className={`${styles.pill} ${category !== "all" ? getCategoryToneClass(category) : ""} ${activeCategory === category ? styles.active : ""}`}
          key={category}
          onClick={() => onChange(category)}
          type="button"
        >
          {category === "all" ? "All" : <CategoryChip category={category} variant="minimal" />}
        </button>
      ))}
    </div>
  );
};
