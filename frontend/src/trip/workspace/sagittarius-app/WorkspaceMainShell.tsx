import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/src/features/workspace/components/app-shell/AppShell";
import type { AppShellProps } from "@/src/features/workspace/components/app-shell/app-shell.types";
import { PhaseBar } from "@/src/features/workspace/components/phase-bar/PhaseBar";
import { PHASE_ORDER, type Phase } from "@/src/trip/workspace/phase";
import { useDerivePhase } from "@/src/trip/workspace/use-derive-phase";
import type { DerivePhaseInput } from "@/src/trip/workspace/derive-phase";
import type { Trip, TripRole } from "@/src/trip/types";
import { TripWorkspaceFrame, type TripWorkspaceFrameProps } from "@/src/trip/workspace/TripWorkspaceFrame";
import { TripWorkspaceRail, type TripWorkspaceRailProps } from "@/src/trip/workspace/TripWorkspaceRail";
import { TripWorkspaceViews, type TripWorkspaceViewsProps } from "@/src/trip/workspace/TripWorkspaceViews";
import type { DetailPlannerPageProps } from "@/src/features/workspace/pages/detail-planner/DetailPlannerPage.types";
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

/** Derive a DerivePhaseInput from the Trip object accessible in the shell. */
function tripToDerivePhaseInput(trip: Trip): DerivePhaseInput {
  const today = new Date().toISOString().slice(0, 10);
  const isTripActive = trip.startDate <= today && trip.endDate >= today;
  return {
    name: trip.name,
    destinationLabel: trip.destinationLabel,
    startDate: trip.startDate,
    endDate: trip.endDate,
    activityCount: trip.itineraryItems?.length ?? 0,
    hasWaypoints: (trip.waypoints?.length ?? 0) > 0,
    hasDateWindow: !!trip.dateWindowStart,
    memberCount: trip.members?.length ?? 1,
    isTripActive,
  };
}

/** Create a typed no-op handler that warns about unimplemented Phase 3 wiring. */
function noOpHandler<T extends (...args: any[]) => any>(handlerName: string): T {
  return ((...args: unknown[]) => {
    console.warn(`[DetailPlannerPage] ${handlerName} is not wired yet`, ...args);
  }) as T;
}

/** Format a date range label from start/end dates (YYYY-MM-DD). */
function formatDateWindowLabel(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const startLabel = `${monthNames[start.getMonth()]} ${start.getFullYear()}`;
  const endLabel = `${monthNames[end.getMonth()]} ${end.getFullYear()}`;
  if (startLabel === endLabel) return startLabel;
  return `${startLabel} – ${endLabel}`;
}

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
  currentPhase: externalPhase,
  onPhaseChange: externalOnPhaseChange,
}: WorkspaceMainShellProps) {
  // Derive phase from trip data when no external phase is provided.
  const deriveInput = useMemo(
    () => tripToDerivePhaseInput(appShellProps.trip),
    [appShellProps.trip],
  );
  const { currentPhase: derivedPhase, availablePhases, setPhase } = useDerivePhase(deriveInput);

  // Use external phase if provided, otherwise use derived phase.
  const currentPhase = externalPhase ?? derivedPhase;
  const onPhaseChange = externalOnPhaseChange ?? setPhase;

  // PhaseBar is always rendered when we have a trip (phase is always derivable).
  const hasPhaseBar = true;

  // Compute unavailable phases from availablePhases.
  const unavailablePhases = useMemo(() => {
    const unavailable = new Set<Phase>();
    for (const phase of PHASE_ORDER) {
      if (!availablePhases.has(phase)) {
        unavailable.add(phase);
      }
    }
    return unavailable;
  }, [availablePhases]);

  // Phases 1 (dreamer), 2 (flexible-hunter), and 6 (on-trip-companion) don't use the right context rail.
  const phaseAwareSupportsContextRail = useMemo(() => {
    if (!currentPhase) return frameProps.supportsContextRail;
    if (PHASES_WITHOUT_CONTEXT_RAIL.has(currentPhase)) return false;
    return frameProps.supportsContextRail;
  }, [currentPhase, frameProps.supportsContextRail]);

  // Derive command bar props from trip data.
  const tripName = appShellProps.trip.name;
  const dateWindowLabel = formatDateWindowLabel(
    appShellProps.trip.startDate,
    appShellProps.trip.endDate,
  );

  // Construct dreamer page props from trip when not provided externally.
  const handleStartPlanning = useCallback(() => {
    setPhase("flexible-hunter");
    if (externalOnPhaseChange) externalOnPhaseChange("flexible-hunter");
  }, [setPhase, externalOnPhaseChange]);

  const enhancedViewsProps = useMemo<TripWorkspaceViewsProps>(() => ({
    ...viewsProps,
    dreamerProps: viewsProps.dreamerProps ?? {
      trip: appShellProps.trip,
      onStartPlanning: handleStartPlanning,
    },
    flexibleHunterProps: viewsProps.flexibleHunterProps ?? {
      trip: appShellProps.trip,
      onDateWindowChange: (_start: string, _end: string) => {
        // Phase 2 UX is display-first — optimistic update deferred to API integration
      },
      onBudgetEdit: (_id: string, _updates: { estimated: number }) => {
        // Phase 2 UX is display-first — optimistic update deferred to API integration
      },
    },
    detailPlannerProps: viewsProps.detailPlannerProps ?? {
      tableProps: {
        items: appShellProps.trip.itineraryItems,
        startDate: appShellProps.trip.startDate,
        endDate: appShellProps.trip.endDate,
        tripPlans: appShellProps.trip.planVariants,
        selectedTripPlanId: appShellProps.trip.activePlanVariantId,
        mainTripPlanId: appShellProps.trip.mainTripPlanId ?? appShellProps.trip.activePlanVariantId,
        tripPlanError: null,
        isTripPlanBusy: false,
        role: (appShellProps.trip.members[0]?.role ?? "owner") as TripRole,
        selectedItemId: appShellProps.trip.itineraryItems[0]?.id ?? "",
        tripName: appShellProps.trip.name,
        onAddStop: noOpHandler<DetailPlannerPageProps["tableProps"]["onAddStop"]>("onAddStop"),
        onOpenItemDetails: noOpHandler<DetailPlannerPageProps["tableProps"]["onOpenItemDetails"]>("onOpenItemDetails"),
        onSelectItem: noOpHandler<DetailPlannerPageProps["tableProps"]["onSelectItem"]>("onSelectItem"),
        onChangeTripPlan: noOpHandler<DetailPlannerPageProps["tableProps"]["onChangeTripPlan"]>("onChangeTripPlan"),
        onChangeTripPlanStatus: noOpHandler<DetailPlannerPageProps["tableProps"]["onChangeTripPlanStatus"]>("onChangeTripPlanStatus"),
        onSetMainTripPlan: noOpHandler<DetailPlannerPageProps["tableProps"]["onSetMainTripPlan"]>("onSetMainTripPlan"),
        onCreateTripPlan: noOpHandler<DetailPlannerPageProps["tableProps"]["onCreateTripPlan"]>("onCreateTripPlan"),
        onRenameTripPlan: noOpHandler<DetailPlannerPageProps["tableProps"]["onRenameTripPlan"]>("onRenameTripPlan"),
      },
      waypoints: appShellProps.trip.waypoints ?? [],
      onImportApply: noOpHandler<NonNullable<DetailPlannerPageProps["onImportApply"]>>("onImportApply"),
      onConvertWaypoints: noOpHandler<NonNullable<DetailPlannerPageProps["onConvertWaypoints"]>>("onConvertWaypoints"),
    },
  }), [viewsProps, appShellProps.trip, handleStartPlanning]);

  // Phase transition animation: 200ms opacity cross-fade.
  const [animPhase, setAnimPhase] = useState(currentPhase);
  const [opacity, setOpacity] = useState(1);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mql.matches;
    const handler = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (currentPhase !== animPhase) {
      if (reducedMotionRef.current) {
        // Instant switch — no animation
        setAnimPhase(currentPhase);
        return;
      }
      // Fade out
      setOpacity(0);
      const timer = setTimeout(() => {
        setAnimPhase(currentPhase);
        setOpacity(0);
        // Fade in on next paint cycle — double rAF ensures browser has painted opacity:0
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setOpacity(1);
          });
        });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [currentPhase, animPhase]);

  const transitionStyle = reducedMotionRef.current
    ? undefined
    : { transition: "opacity 200ms ease" } as React.CSSProperties;

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
            tripName={tripName}
            dateWindowLabel={dateWindowLabel}
            rail={<TripWorkspaceRail {...railProps} />}
          >
            <div key={animPhase} style={{ ...transitionStyle, opacity }}>
              <TripWorkspaceViews {...enhancedViewsProps} />
            </div>
          </TripWorkspaceFrame>
          <WorkspaceDialogs {...dialogsProps} />
        </main>
      </AppShell>
    </div>
  );
}
