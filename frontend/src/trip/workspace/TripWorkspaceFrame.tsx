import type { ReactNode } from "react";
import { CommandBar } from "@/src/shared/components/command-bar/CommandBar";

const workspaceGridClassName =
  "workspace-grid relative grid h-screen min-h-0 grid-cols-[minmax(0,1fr)] overflow-hidden max-[1199px]:h-auto max-[1199px]:grid-cols-1 max-[1199px]:overflow-visible";
const planningMainClassName =
  "planning-main h-full min-h-0 min-w-0 overflow-y-auto scroll-smooth bg-(--color-page) transition-[padding] duration-200 max-[1199px]:h-auto max-[1199px]:min-h-[calc(100dvh-48px)] max-[1199px]:overflow-y-visible max-[1199px]:bg-(--color-surface)";
const planningMainWithRailClassName = "pr-[320px] max-[1199px]:pr-0";
const importErrorClassName =
  "mx-6 mt-3 rounded-(--radius-sm) border border-(--color-danger-border) bg-(--color-danger-soft) px-3 py-2 text-sm font-bold text-(--color-danger) max-[767px]:mx-3";

export interface TripWorkspaceFrameProps {
  children: ReactNode;
  contextRailOpen: boolean;
  importError: string | null;
  rail: ReactNode;
  supportsContextRail: boolean;
  /** Trip name for the cross-phase command bar. */
  tripName?: string;
  /** Date window or fixed date range label for the command bar. */
  dateWindowLabel?: string;
  /** Whether there are unsaved trip changes (shows draft badge). */
  isTripDirty?: boolean;
  /** When true, hides the command bar (e.g. Phase 6 mobile). */
  commandBarHidden?: boolean;
}

export function TripWorkspaceFrame({
  children,
  contextRailOpen,
  importError,
  rail,
  supportsContextRail,
  tripName,
  dateWindowLabel,
  isTripDirty,
  commandBarHidden,
}: TripWorkspaceFrameProps) {
  const showCommandBar = tripName !== undefined;

  return (
    <div
      className={workspaceGridClassName}
      data-context-rail={contextRailOpen ? "open" : "closed"}
      data-command-bar={showCommandBar && !commandBarHidden ? "visible" : "hidden"}
    >
      {showCommandBar ? (
        <CommandBar
          tripName={tripName}
          dateWindowLabel={dateWindowLabel ?? ""}
          isDirty={isTripDirty}
          hidden={commandBarHidden}
        />
      ) : null}
      <div
        className={`${planningMainClassName} ${
          contextRailOpen && supportsContextRail
            ? planningMainWithRailClassName
            : ""
        }`}
      >
        {children}
      </div>
      {importError ? (
        <p className={importErrorClassName} role="alert">
          {importError}
        </p>
      ) : null}
      {rail}
    </div>
  );
}
