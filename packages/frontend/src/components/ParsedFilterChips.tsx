import { getCategoryLabel, getCategoryToneClass } from "../utils/categoryTheme";
import type { ParsedFilters } from "../api/search";

interface ParsedFilterChipsProps {
  filters: ParsedFilters;
  onRemove: (key: "category" | "maxCapacity" | "minCapacity" | "dateFrom" | "dateTo" | "keywords") => void;
}

export const ParsedFilterChips = ({ filters, onRemove }: ParsedFilterChipsProps) => {
  return (
    <div className="understood-row">
      <span>Understood as:</span>
      <div className="chip-wrap">
        {filters.category && (
          <button className={`chip ${getCategoryToneClass(filters.category)}`} onClick={() => onRemove("category")} type="button">
            <span className="category-dot" />
            {getCategoryLabel(filters.category)} ×
          </button>
        )}
        {filters.maxCapacity !== null && (
          <button className="chip" onClick={() => onRemove("maxCapacity")} type="button">
            Capacity {"<"} {filters.maxCapacity} ×
          </button>
        )}
        {filters.minCapacity !== null && (
          <button className="chip" onClick={() => onRemove("minCapacity")} type="button">
            Capacity {">"} {filters.minCapacity} ×
          </button>
        )}
        {filters.dateRange.from && filters.dateRange.to && (
          <button className="chip" onClick={() => onRemove("dateFrom")} type="button">
            {new Date(filters.dateRange.from).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric"
            })}{" "}
            -{" "}
            {new Date(filters.dateRange.to).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric"
            })}{" "}
            ×
          </button>
        )}
        {filters.keywords.length > 0 && (
          <button className="chip" onClick={() => onRemove("keywords")} type="button">
            {filters.keywords[0]} ×
          </button>
        )}
      </div>
    </div>
  );
};
