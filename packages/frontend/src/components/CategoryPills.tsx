import type { EventCategory } from "@event-platform/shared";
import { getCategoryLabel, getCategoryToneClass } from "../utils/categoryTheme";

interface CategoryPillsProps {
  activeCategory: "all" | EventCategory;
  onChange: (value: "all" | EventCategory) => void;
}

export const CategoryPills = ({ activeCategory, onChange }: CategoryPillsProps) => {
  return (
    <div className="category-pills">
      {(["all", "tech", "networking", "workshop", "social"] as const).map((category) => (
        <button
          className={`category-pill ${category === "all" ? "" : getCategoryToneClass(category)} ${activeCategory === category ? "active" : ""}`}
          key={category}
          onClick={() => onChange(category)}
          type="button"
        >
          {category === "all" ? "All" : (
            <>
              <span className="category-dot" />
              {getCategoryLabel(category)}
            </>
          )}
        </button>
      ))}
    </div>
  );
};
