export const LoadingBlocks = ({ count = 3 }: { count?: number }) => {
  return (
    <section className="loading-list" aria-label="Loading">
      {Array.from({ length: count }).map((_, index) => (
        <div className="loading-block" key={index} />
      ))}
    </section>
  );
};
