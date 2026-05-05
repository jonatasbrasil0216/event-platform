import { Search } from "lucide-react";
import styles from "./styles.module.css";

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export const SearchBox = ({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled = false,
  isLoading = false
}: SearchBoxProps) => {
  return (
    <div className={styles.searchRow}>
      <div className={styles.searchInputWrap}>
        <span className={styles.searchIcon} aria-hidden="true">
          <Search size={16} strokeWidth={1.9} />
        </span>
        <input
          className={styles.searchInput}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !disabled) onSubmit();
          }}
          placeholder={placeholder ?? "Search events"}
          value={value}
        />
        {isLoading ? (
          <span aria-label="Searching" className={styles.searchSpinner} />
        ) : (
          <span className={styles.searchHint}>Press ↵</span>
        )}
      </div>
    </div>
  );
};
