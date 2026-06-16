const portalLoadingCardClassName =
  "account-card portal-loading-card grid min-h-[220px] gap-3.5 rounded-(--radius-lg) border border-(--color-border) bg-[rgb(255_255_255_/_0.94)] p-4 shadow-[var(--shadow-panel)]";
const portalSkeletonBaseClassName =
  "portal-skeleton block overflow-hidden rounded-(--radius-md) bg-[linear-gradient(90deg,var(--color-surface-subtle),rgb(226_232_240_/_0.72),var(--color-surface-subtle))] bg-[length:220%_100%] animate-[portal-skeleton-pulse_1.2s_ease-in-out_infinite] motion-reduce:animate-none";
const portalSkeletonTitleClassName = `${portalSkeletonBaseClassName} portal-skeleton--title h-7 w-[min(220px,48%)]`;
const portalSkeletonLineClassName = `${portalSkeletonBaseClassName} portal-skeleton--line h-4 w-[min(520px,72%)]`;
const portalSkeletonBlockClassName = `${portalSkeletonBaseClassName} portal-skeleton--block h-[132px] w-full`;

export function TripAccessLoadingFrame() {
  return (
    <main
      className="account-page account-page--portal"
      aria-busy="true"
      aria-label="Opening trip"
    >
      <section className={portalLoadingCardClassName}>
        <span className={portalSkeletonTitleClassName} />
        <span className={portalSkeletonLineClassName} />
        <span className={portalSkeletonBlockClassName} />
      </section>
    </main>
  );
}
