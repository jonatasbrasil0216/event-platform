import type { CSSProperties } from "react";

interface SegmentedTabItem<T extends string> {
  id: T;
  label: string;
  count: number;
}

interface SegmentedCountTabsProps<T extends string> {
  items: SegmentedTabItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
  ariaLabel: string;
  className?: string;
}

export const SegmentedCountTabs = <T extends string>({
  items,
  activeId,
  onChange,
  ariaLabel,
  className
}: SegmentedCountTabsProps<T>) => {
  return (
    <div
      className={className ? `segmented-count-tabs ${className}` : "segmented-count-tabs"}
      role="tablist"
      aria-label={ariaLabel}
      style={{ "--segmented-tab-count": items.length } as CSSProperties}
    >
      {items.map((item) => (
        <button
          className={`segmented-count-tab ${activeId === item.id ? "active" : ""}`}
          key={item.id}
          onClick={() => onChange(item.id)}
          role="tab"
          type="button"
        >
          {item.label} · {item.count}
        </button>
      ))}
    </div>
  );
};
