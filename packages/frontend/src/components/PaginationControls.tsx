import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import styles from "./PaginationControls.module.css";

const NAV_ICON_PX = 24;

/** Up to three page numbers in a sliding window; use << >> to jump further. */
const buildPaginationItems = (page: number, pageCount: number): number[] => {
  if (pageCount <= 1) {
    return [];
  }
  const windowSize = Math.min(3, pageCount);
  if (windowSize === pageCount) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const start = Math.min(Math.max(page - 1, 1), pageCount - windowSize + 1);
  return Array.from({ length: windowSize }, (_, i) => start + i);
};

interface PaginationControlsProps {
  page: number;
  pageCount: number;
  onPageChange: (nextPage: number) => void;
}

export const PaginationControls = ({ page, pageCount, onPageChange }: PaginationControlsProps) => {
  const items = buildPaginationItems(page, pageCount);

  return (
    <div className={styles.controls}>
      <button
        aria-label="First page"
        className={`btn btn-secondary ${styles.navBtn}`}
        disabled={page <= 1 || pageCount <= 1}
        onClick={() => onPageChange(1)}
        type="button"
      >
        <ChevronsLeft aria-hidden size={NAV_ICON_PX} strokeWidth={2} />
      </button>
      <button
        aria-label="Previous page"
        className={`btn btn-secondary ${styles.navBtn}`}
        disabled={page <= 1 || pageCount <= 1}
        onClick={() => onPageChange(Math.max(page - 1, 1))}
        type="button"
      >
        <ChevronLeft aria-hidden size={NAV_ICON_PX} strokeWidth={2} />
      </button>
      {items.map((item) => (
        <button
          aria-current={page === item ? "page" : undefined}
          aria-label={`Go to page ${item}`}
          className={`${styles.pageBtn} ${page === item ? styles.pageBtnActive : ""}`}
          key={item}
          onClick={() => onPageChange(item)}
          type="button"
        >
          {item}
        </button>
      ))}
      <button
        aria-label="Next page"
        className={`btn btn-secondary ${styles.navBtn}`}
        disabled={page >= pageCount || pageCount <= 1}
        onClick={() => onPageChange(Math.min(page + 1, pageCount))}
        type="button"
      >
        <ChevronRight aria-hidden size={NAV_ICON_PX} strokeWidth={2} />
      </button>
      <button
        aria-label="Last page"
        className={`btn btn-secondary ${styles.navBtn}`}
        disabled={page >= pageCount || pageCount <= 1}
        onClick={() => onPageChange(pageCount)}
        type="button"
      >
        <ChevronsRight aria-hidden size={NAV_ICON_PX} strokeWidth={2} />
      </button>
    </div>
  );
};
