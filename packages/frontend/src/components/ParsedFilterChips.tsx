import { getCategoryLabel, getCategoryToneClass } from "../utils/categoryTheme";
import type { ParsedFilters } from "../api/search";
import styles from "./ParsedFilterChips.module.css";

interface ParsedFilterChipsProps {
  filters: ParsedFilters;
  onRemove: (key: "category" | "maxCapacity" | "minCapacity" | "dateFrom" | "dateTo" | "keywords") => void;
}

export const ParsedFilterChips = ({ filters, onRemove }: ParsedFilterChipsProps) => {
  return (
    <div className={styles.row}>
      <span>Understood as:</span>
      <div className={styles.chipWrap}>
        {filters.category && (
          <button
            className={`${styles.chip} ${getCategoryToneClass(filters.category)}`}
            onClick={() => onRemove("category")}
            type="button"
          >
            <span className={styles.toneDot} />
            {getCategoryLabel(filters.category)} ×
          </button>
        )}
        {filters.maxCapacity !== null && (
          <button className={styles.chip} onClick={() => onRemove("maxCapacity")} type="button">
            Capacity {"<"} {filters.maxCapacity} ×
          </button>
        )}
        {filters.minCapacity !== null && (
          <button className={styles.chip} onClick={() => onRemove("minCapacity")} type="button">
            Capacity {">"} {filters.minCapacity} ×
          </button>
        )}
        {filters.dateRange.from && filters.dateRange.to && (
          <button className={styles.chip} onClick={() => onRemove("dateFrom")} type="button">
            {new Date(filters.dateRange.from).toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
            -{" "}
            {new Date(filters.dateRange.to).toLocaleDateString("en-US", { month: "short", day: "numeric" })} ×
          </button>
        )}
        {filters.keywords.length > 0 && (
          <button className={styles.chip} onClick={() => onRemove("keywords")} type="button">
            {filters.keywords[0]} ×
          </button>
        )}
      </div>
    </div>
  );
};
