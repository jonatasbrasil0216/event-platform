import styles from "./LoadingBlocks.module.css";

export const LoadingBlocks = ({ count = 3 }: { count?: number }) => {
  return (
    <section className={styles.list} aria-label="Loading">
      {Array.from({ length: count }).map((_, index) => (
        <div className={styles.block} key={index} />
      ))}
    </section>
  );
};
