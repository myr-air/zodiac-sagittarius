"use client";

import type { ComponentProps } from "react";
import Link from "next/link";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { WorkspaceEmptyState } from "@/src/shared/components/workspace-empty-state";
import { WorkspaceSummaryStat } from "@/src/shared/components/workspace-summary-stat";
import { PortalSkeleton } from "@/src/shared/components/portal-skeleton";
import {
  accountSettingLineClassName,
  accountStatClassName,
  portalEmptyStateClassName,
  portalListSkeletonClassName,
  portalListSkeletonCompactClassName,
  portalSkeletonCardClassName,
  portalSkeletonRowClassName,
} from "./account-portal-primitives.styles";

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
    <WorkspaceEmptyState
      action={(
        <Button asChild variant="secondary">
          <Link href={actionHref}>
            <Icon name="plus" />
            {actionLabel}
          </Link>
        </Button>
      )}
      className={portalEmptyStateClassName}
      detail={detail}
      icon={<Icon name={icon} />}
      title={title}
    />
  );
}

export function Stat({ label, value }: { label: string; value: number }) {
  return (
    <WorkspaceSummaryStat
      className={accountStatClassName}
      label={label}
      value={String(value)}
      valueFirst
    />
  );
}

export function PortalStatSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }, (_, index) => (
        <div className={portalSkeletonCardClassName} key={index}>
          <PortalSkeleton variant="number" />
          <PortalSkeleton variant="short" />
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
          <PortalSkeleton variant="icon" />
          <PortalSkeleton variant="line" />
          <PortalSkeleton variant="short" />
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
