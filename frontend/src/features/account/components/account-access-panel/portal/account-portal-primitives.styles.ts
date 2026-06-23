import { cn } from "@/src/lib/cn";

export const accountMetricLineClassName =
  "grid min-h-[66px] content-center gap-0.5 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) p-2.5 [&_span]:text-xs [&_span]:font-extrabold [&_span]:text-(--color-text-muted) [&_strong]:text-(--color-text)";

export const accountStatClassName = cn(
  "account-stat",
  accountMetricLineClassName,
  "[&_strong]:text-2xl [&_strong]:leading-7",
);

export const portalSkeletonCardClassName = cn(
  accountStatClassName,
  "portal-skeleton-card",
);

export const portalListSkeletonClassName = "portal-list-skeleton grid gap-2";

export const portalListSkeletonCompactClassName = cn(
  portalListSkeletonClassName,
  "portal-list-skeleton--compact grid-cols-2 max-[520px]:grid-cols-1",
);

export const portalSkeletonRowClassName =
  "portal-skeleton-row grid min-h-[62px] grid-cols-[36px_minmax(0,1fr)_96px] items-center gap-3 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) p-2.5";

export const accountSettingLineClassName = cn(
  "account-setting-line",
  accountMetricLineClassName,
  "[&_strong]:text-sm",
);

export const portalEmptyStateClassName =
  "portal-empty-state grid min-h-[164px] content-center gap-3 rounded-(--radius-lg) border border-dashed border-(--color-border-strong) bg-[color-mix(in_srgb,var(--color-surface-subtle)_72%,var(--color-surface))] p-4 text-left [&_.button]:w-fit max-[767px]:[&_.button]:w-full [&>div]:max-w-[560px] [&>span[aria-hidden=true]]:grid [&>span[aria-hidden=true]]:size-10 [&>span[aria-hidden=true]]:place-items-center [&>span[aria-hidden=true]]:rounded-(--radius-md) [&>span[aria-hidden=true]]:bg-(--color-primary-soft) [&>span[aria-hidden=true]]:text-(--color-primary-strong) [&_p]:m-0 [&_p]:max-w-[560px] [&_p]:text-[13px] [&_p]:leading-5 [&_p]:text-(--color-text-muted) [&_strong]:block [&_strong]:text-base [&_strong]:leading-6 [&_strong]:text-(--color-text)";
