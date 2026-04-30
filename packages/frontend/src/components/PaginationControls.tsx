interface PaginationControlsProps {
  page: number;
  pageCount: number;
  onPageChange: (nextPage: number) => void;
}

export const PaginationControls = ({ page, pageCount, onPageChange }: PaginationControlsProps) => {
  const pages = Array.from({ length: pageCount }, (_, pageIndex) => pageIndex + 1);

  return (
    <div className="pagination-controls">
      <button
        aria-label="Previous page"
        className="btn btn-secondary pagination-btn"
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(page - 1, 1))}
        type="button"
      >
        ‹
      </button>

      {pages.map((pageNumber) => (
        <button
          aria-label={`Go to page ${pageNumber}`}
          className={`btn btn-secondary pagination-btn ${pageNumber === page ? "pagination-btn--active" : ""}`}
          key={pageNumber}
          onClick={() => onPageChange(pageNumber)}
          type="button"
        >
          {pageNumber}
        </button>
      ))}

      <button
        aria-label="Next page"
        className="btn btn-secondary pagination-btn"
        disabled={page >= pageCount}
        onClick={() => onPageChange(Math.min(page + 1, pageCount))}
        type="button"
      >
        ›
      </button>
    </div>
  );
};
