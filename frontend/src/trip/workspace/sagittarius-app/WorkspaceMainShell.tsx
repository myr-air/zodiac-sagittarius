import { useMemo } from "react";
import { AppShell } from "@/src/features/workspace/components/app-shell/AppShell";
import type { AppShellProps } from "@/src/features/workspace/components/app-shell/app-shell.types";
import { PhaseBar } from "@/src/features/workspace/components/phase-bar/PhaseBar";
import { PHASE_ORDER, type Phase } from "@/src/trip/workspace/phase";
import { TripWorkspaceFrame, type TripWorkspaceFrameProps } from "@/src/trip/workspace/TripWorkspaceFrame";
import { TripWorkspaceRail, type TripWorkspaceRailProps } from "@/src/trip/workspace/TripWorkspaceRail";
import { TripWorkspaceViews, type TripWorkspaceViewsProps } from "@/src/trip/workspace/TripWorkspaceViews";
import type { DetailPlannerPageProps } from "@/src/features/workspace/pages/detail-planner/DetailPlannerPage.types";
import type { RouteBuilderPageProps } from "@/src/features/workspace/pages/route-builder/RouteBuilderPage.types";
import type { NowNextState } from "@/src/trip/itinerary-core/itinerary-types";
import type { Member } from "@/src/trip/members/member-types";
import type { RsvpStatus } from "@/src/trip/rsvp";
import { buildSettlementSuggestions } from "@/src/trip/expenses/expense-settlements";
import { WorkspaceToast, type WorkspaceToastProps } from "@/src/trip/workspace/WorkspaceToast";
import { WorkspaceDialogs, type WorkspaceDialogsProps } from "./WorkspaceDialogs";
import { WorkspaceRolePreview, type WorkspaceRolePreviewProps } from "./WorkspaceRolePreview";
import { OfflineBanner } from "@/src/features/workspace/components/offline";
import { workspaceShellClassName } from "./sagittarius-app.styles";

export interface WorkspaceMainShellProps {
  appShellProps: Omit<AppShellProps, "children">;
  dialogsProps: WorkspaceDialogsProps;
  frameProps: Omit<TripWorkspaceFrameProps, "children" | "rail">;
  railProps: TripWorkspaceRailProps;
  rolePreviewProps: WorkspaceRolePreviewProps;
  showRolePreview: boolean;
  showToast: boolean;
  toastProps: WorkspaceToastProps;
  viewsProps: TripWorkspaceViewsProps;
  /** Current journey phase. When provided, PhaseBar renders above the workspace. */
  currentPhase?: Phase;
  /** Called when the user clicks a PhaseBar tab. */
  onPhaseChange?: (phase: Phase) => void;
}

/** Phases that do not support the right context rail. */
const PHASES_WITHOUT_CONTEXT_RAIL: Set<Phase> = new Set([
  "dreamer",
  "flexible-hunter",
  "on-trip-companion",
]);

export function WorkspaceMainShell({
  appShellProps,
  dialogsProps,
  frameProps,
  railProps,
  rolePreviewProps,
  showRolePreview,
  showToast,
  toastProps,
  viewsProps,
  currentPhase,
  onPhaseChange,
}: WorkspaceMainShellProps) {
  const hasPhaseBar = currentPhase !== undefined && onPhaseChange !== undefined;

  // Phases 1 (dreamer), 2 (flexible-hunter), and 6 (on-trip-companion) don't use the right context rail.
  const phaseAwareSupportsContextRail = useMemo(() => {
    if (!currentPhase) return frameProps.supportsContextRail;
    if (PHASES_WITHOUT_CONTEXT_RAIL.has(currentPhase)) return false;
    return frameProps.supportsContextRail;
  }, [currentPhase, frameProps.supportsContextRail]);

  // Compute unavailable phases: all phases beyond those with prerequisite data are unavailable.
  // When no trip data is available, only dreamer is available.
  const unavailablePhases = useMemo(() => {
    if (!currentPhase) return new Set<Phase>();
    // All phases are considered available for exploration when PhaseBar is active.
    // Unavailability is determined by the parent based on trip data.
    return new Set<Phase>();
  }, [currentPhase]);

  return (
    <div className="flex flex-col min-h-screen">
      {hasPhaseBar ? (
        <PhaseBar
          phases={PHASE_ORDER}
          currentPhase={currentPhase}
          onPhaseChange={onPhaseChange}
          unavailablePhases={unavailablePhases}
        />
      ) : null}
      <AppShell {...appShellProps} phase={currentPhase}>
        <main className={workspaceShellClassName}>
          {showToast ? <WorkspaceToast {...toastProps} /> : null}
          {showRolePreview ? <WorkspaceRolePreview {...rolePreviewProps} /> : null}
          <TripWorkspaceFrame
            {...frameProps}
            supportsContextRail={phaseAwareSupportsContextRail}
            rail={<TripWorkspaceRail {...railProps} />}
          >
            <TripWorkspaceViews {...viewsProps} />
          </TripWorkspaceFrame>
          <WorkspaceDialogs {...dialogsProps} />
        </main>
      </AppShell>
    </div>
  );
}
