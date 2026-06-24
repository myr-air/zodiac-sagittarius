import { PortalSkeleton } from "@/src/shared/components/portal-skeleton";

const portalLoadingCardClassName =
  "account-card portal-loading-card grid min-h-[220px] gap-3.5 rounded-(--radius-lg) border border-(--color-border) bg-[rgb(255_255_255_/_0.94)] p-4 shadow-[var(--shadow-panel)]";

export function TripAccessLoadingFrame() {
  return (
    <main
      className="account-page account-page--portal"
      aria-busy="true"
      aria-label="Opening trip"
    >
      <section className={portalLoadingCardClassName}>
        <PortalSkeleton variant="title" />
        <PortalSkeleton variant="line" />
        <PortalSkeleton variant="block" />
      </section>
    </main>
  );
}
