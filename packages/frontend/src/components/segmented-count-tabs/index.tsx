import styles from "./styles.module.css";

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
      className={className ? `${styles.tabs} ${className}` : styles.tabs}
      role="tablist"
      aria-label={ariaLabel}
    >
      {items.map((item) => (
        <button
          className={`${styles.tab} ${activeId === item.id ? styles.active : ""}`}
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
