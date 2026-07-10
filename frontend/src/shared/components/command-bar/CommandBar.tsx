import type { ReactNode } from "react";
import { cn } from "../../../lib/cn";
import {
  commandBarRootClassName,
  commandBarContentClassName,
  commandBarTripNameClassName,
  commandBarDateLabelClassName,
  commandBarBadgeBaseClassName,
  commandBarBadgeSavedClassName,
  commandBarBadgeDraftClassName,
} from "./CommandBar.styles";

export interface CommandBarProps {
  /** Trip name, truncated to 40 characters. */
  tripName: string;
  /** Date window label (e.g. "March–April 2027") or fixed dates. */
  dateWindowLabel: string;
  /** When true, shows a draft badge. When false/undefined, shows saved badge. */
  isDirty?: boolean;
  /** When true, the command bar is visually hidden. */
  hidden?: boolean;
  /** Optional slot for additional actions (e.g. phase-specific controls). */
  children?: ReactNode;
  className?: string;
}

/**
 * Cross-phase command bar showing trip name, date window, and save state.
 * Persists across all phases — rendered inside TripWorkspaceFrame above the view content.
 * Compact at 48px height.
 */
export function CommandBar({
  tripName,
  dateWindowLabel,
  isDirty = false,
  hidden = false,
  children,
  className,
}: CommandBarProps) {
  if (hidden) return null;

  const truncatedName = tripName.length > 40 ? `${tripName.slice(0, 39)}…` : tripName;

  return (
    <div className={cn(commandBarRootClassName, className)}>
      <div className={commandBarContentClassName}>
        <span className={commandBarTripNameClassName} title={tripName}>
          {truncatedName}
        </span>
        <span className={commandBarDateLabelClassName}>{dateWindowLabel}</span>
        <span
          className={cn(
            commandBarBadgeBaseClassName,
            isDirty ? commandBarBadgeDraftClassName : commandBarBadgeSavedClassName,
          )}
        >
          {isDirty ? "ร่าง" : "บันทึกแล้ว"}
        </span>
      </div>
      {children}
    </div>
  );
}
