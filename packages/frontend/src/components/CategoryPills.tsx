import type { EventCategory } from "@event-platform/shared";

interface CategoryPillsProps {
  activeCategory: "all" | EventCategory;
  onChange: (value: "all" | EventCategory) => void;
}

export const CategoryPills = ({ activeCategory, onChange }: CategoryPillsProps) => {
  return (
    <div className="category-pills">
      {(["all", "tech", "networking", "workshop", "social"] as const).map((category) => (
        <button
          className={`category-pill ${activeCategory === category ? "active" : ""}`}
          key={category}
          onClick={() => onChange(category)}
          type="button"
        >
          {category === "all" ? "All" : category[0].toUpperCase() + category.slice(1)}
        </button>
      ))}
    </div>
  );
};
