import { Search } from "lucide-react";

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}

export const SearchBox = ({ value, onChange, onSubmit, placeholder }: SearchBoxProps) => {
  return (
    <div className="search-row">
      <div className="search-input-wrap">
        <span className="search-icon" aria-hidden="true">
          <Search size={16} strokeWidth={1.9} />
        </span>
        <input
          className="search-input"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSubmit();
            }
          }}
          placeholder={placeholder ?? "Search events"}
          value={value}
        />
        <span className="search-hint">Press ↵</span>
      </div>
    </div>
  );
};
