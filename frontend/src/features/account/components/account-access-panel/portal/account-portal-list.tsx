import type { ReactNode } from "react";
import { Icon, type IconName } from "@/src/ui/icons";

export const portalListClassName = "account-trip-list grid gap-2";
export const portalListRowClassName =
  "account-trip-row flex min-h-[62px] min-w-0 items-center gap-3 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) p-2.5 text-inherit no-underline transition-[border-color,background] duration-[180ms] ease-out hover:border-[color-mix(in_srgb,var(--color-primary)_32%,var(--color-border))] hover:bg-[color-mix(in_srgb,var(--color-primary-soft)_52%,var(--color-surface))] focus-visible:border-[color-mix(in_srgb,var(--color-primary)_32%,var(--color-border))] focus-visible:bg-[color-mix(in_srgb,var(--color-primary-soft)_52%,var(--color-surface))] focus-visible:outline-none max-[767px]:flex-wrap max-[767px]:items-start [&>.badge]:ml-auto max-[767px]:[&>.badge]:ml-0 [&>div]:max-[767px]:min-w-0 [&_span]:text-[13px] [&_span]:leading-5 [&_span]:text-(--color-text-muted) max-[767px]:[&_span]:[overflow-wrap:anywhere] [&_strong]:block [&_strong]:text-(--color-text)";
export const portalListIconClassName =
  "account-trip-icon grid size-9 shrink-0 place-items-center rounded-(--radius-md) bg-(--color-primary-soft) text-(--color-primary-strong)";

export function PortalList({ children }: { children: ReactNode }) {
  return <div className={portalListClassName}>{children}</div>;
}

export function PortalListRow({
  action,
  badge,
  detail,
  icon,
  title,
}: {
  action?: ReactNode;
  badge?: ReactNode;
  detail: ReactNode;
  icon: IconName;
  title: ReactNode;
}) {
  return (
    <article className={portalListRowClassName}>
      <span className={portalListIconClassName} aria-hidden="true"><Icon name={icon} /></span>
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      {badge}
      {action}
    </article>
  );
}
