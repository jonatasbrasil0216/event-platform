import { useRef } from "react";

interface DatePickerButtonProps {
  value: string;
  onChange: (value: string) => void;
}

export const DatePickerButton = ({ value, onChange }: DatePickerButtonProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const label = value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "Any date";

  const openPicker = () => {
    if (!inputRef.current) return;
    const input = inputRef.current as HTMLInputElement & { showPicker?: () => void };
    if (typeof input.showPicker === "function") {
      input.showPicker();
    } else {
      input.focus();
      input.click();
    }
  };

  const handleButtonClick = () => {
    if (value) {
      onChange("");
      return;
    }
    openPicker();
  };

  return (
    <div className="date-filter-wrap">
      <button className="date-filter-btn" onClick={handleButtonClick} type="button">
        {label}
      </button>
      <input
        className="date-anchor-input"
        onChange={(event) => onChange(event.target.value)}
        ref={inputRef}
        tabIndex={-1}
        type="date"
        value={value}
      />
    </div>
  );
};
