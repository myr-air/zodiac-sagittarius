"use client";

import type { ComponentProps } from "react";
import Link from "next/link";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { cn } from "@/src/lib/cn";

const accountPanelHeadingClassName =
  "account-panel-heading flex min-w-0 items-center gap-3 max-[767px]:flex-wrap max-[767px]:items-start [&>div]:max-[767px]:min-w-0 [&_small]:text-[13px] [&_small]:leading-5 [&_small]:text-(--color-text-muted) max-[767px]:[&_small]:[overflow-wrap:anywhere] [&_span[aria-hidden=true]]:grid [&_span[aria-hidden=true]]:size-9 [&_span[aria-hidden=true]]:shrink-0 [&_span[aria-hidden=true]]:place-items-center [&_span[aria-hidden=true]]:rounded-(--radius-md) [&_span[aria-hidden=true]]:bg-(--color-primary-soft) [&_span[aria-hidden=true]]:text-(--color-primary-strong) [&_strong]:block [&_strong]:text-(--color-text)";
export const accountStatClassName =
  "account-stat grid min-h-[66px] content-center gap-0.5 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) p-2.5 [&_span]:text-xs [&_span]:font-extrabold [&_span]:text-(--color-text-muted) [&_strong]:text-2xl [&_strong]:leading-7 [&_strong]:text-(--color-text)";
const portalSkeletonBaseClassName =
  "portal-skeleton block overflow-hidden rounded-(--radius-md) bg-[linear-gradient(90deg,var(--color-surface-subtle),rgb(226_232_240_/_0.72),var(--color-surface-subtle))] bg-[length:220%_100%] animate-[portal-skeleton-pulse_1.2s_ease-in-out_infinite] motion-reduce:animate-none";
export const portalSkeletonTitleClassName = cn(portalSkeletonBaseClassName, "portal-skeleton--title h-7 w-[min(220px,48%)]");
export const portalSkeletonLineClassName = cn(portalSkeletonBaseClassName, "portal-skeleton--line h-4 w-[min(520px,72%)]");
export const portalSkeletonBlockClassName = cn(portalSkeletonBaseClassName, "portal-skeleton--block h-[132px] w-full");
const portalSkeletonNumberClassName = cn(portalSkeletonBaseClassName, "portal-skeleton--number h-[26px] w-[34px]");
const portalSkeletonShortClassName = cn(portalSkeletonBaseClassName, "portal-skeleton--short h-3.5 w-24");
const portalSkeletonIconClassName = cn(portalSkeletonBaseClassName, "portal-skeleton--icon size-9");
const portalSkeletonCardClassName = cn(accountStatClassName, "portal-skeleton-card");
const portalListSkeletonClassName = "portal-list-skeleton grid gap-2";
const portalListSkeletonCompactClassName = cn(portalListSkeletonClassName, "portal-list-skeleton--compact grid-cols-2 max-[520px]:grid-cols-1");
const portalSkeletonRowClassName =
  "portal-skeleton-row grid min-h-[62px] grid-cols-[36px_minmax(0,1fr)_96px] items-center gap-3 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) p-2.5";
const accountSettingLineClassName =
  "account-setting-line grid min-h-[66px] content-center gap-0.5 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) p-2.5 [&_span]:text-xs [&_span]:font-extrabold [&_span]:text-(--color-text-muted) [&_strong]:text-sm [&_strong]:text-(--color-text)";
const portalEmptyStateClassName =
  "portal-empty-state grid min-h-[164px] content-center gap-3 rounded-(--radius-lg) border border-dashed border-(--color-border-strong) bg-[color-mix(in_srgb,var(--color-surface-subtle)_72%,var(--color-surface))] p-4 text-left [&_.button]:w-fit max-[767px]:[&_.button]:w-full [&>span[aria-hidden=true]]:grid [&>span[aria-hidden=true]]:size-10 [&>span[aria-hidden=true]]:place-items-center [&>span[aria-hidden=true]]:rounded-(--radius-md) [&>span[aria-hidden=true]]:bg-(--color-primary-soft) [&>span[aria-hidden=true]]:text-(--color-primary-strong) [&_p]:m-0 [&_p]:max-w-[560px] [&_p]:text-[13px] [&_p]:leading-5 [&_p]:text-(--color-text-muted) [&_strong]:block [&_strong]:text-base [&_strong]:leading-6 [&_strong]:text-(--color-text)";

export function PanelHeading({ detail, icon, title }: { detail: string; icon: ComponentProps<typeof Icon>["name"]; title: string }) {
  return (
    <div className={accountPanelHeadingClassName}>
      <span aria-hidden="true"><Icon name={icon} /></span>
      <div>
        <strong>{title}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}

export function PortalEmptyState({
  actionHref,
  actionLabel,
  detail,
  icon,
  title,
}: {
  actionHref: string;
  actionLabel: string;
  detail: string;
  icon: ComponentProps<typeof Icon>["name"];
  title: string;
}) {
  return (
    <div className={portalEmptyStateClassName}>
      <span aria-hidden="true"><Icon name={icon} /></span>
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
      <Button asChild variant="secondary">
        <Link href={actionHref}>
          <Icon name="plus" />
          {actionLabel}
        </Link>
      </Button>
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={accountStatClassName}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export function PortalStatSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }, (_, index) => (
        <div className={portalSkeletonCardClassName} key={index}>
          <span className={portalSkeletonNumberClassName} />
          <span className={portalSkeletonShortClassName} />
        </div>
      ))}
    </>
  );
}

export function PortalListSkeleton({ compact = false, rows }: { compact?: boolean; rows: number }) {
  return (
    <div className={compact ? portalListSkeletonCompactClassName : portalListSkeletonClassName} aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div className={portalSkeletonRowClassName} key={index}>
          <span className={portalSkeletonIconClassName} />
          <span className={portalSkeletonLineClassName} />
          <span className={portalSkeletonShortClassName} />
        </div>
      ))}
    </div>
  );
}

export function SettingLine({ label, value }: { label: string; value: string }) {
  return (
    <div className={accountSettingLineClassName}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
