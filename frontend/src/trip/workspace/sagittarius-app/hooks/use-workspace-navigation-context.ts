import { useCallback } from "react";
import type { PlanningView } from "@/src/trip/workspace/planning-view";
import { workspaceViewSupportsContextRail } from "@/src/trip/workspace/planning-view";
import { useWorkspaceNavigation } from "@/src/trip/workspace/use-workspace-navigation";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";

interface UseWorkspaceNavigationContextParams {
  initialView: PlanningView;
  routeTripId?: string;
  setContextRailVisibility: (open: boolean) => void;
  tripId: string;
}

export function useWorkspaceNavigationContext({
  initialView,
  routeTripId,
  setContextRailVisibility,
  tripId,
}: UseWorkspaceNavigationContextParams) {
  const {
    currentView,
    navigateWorkspacePath,
    replaceWorkspacePath,
  } = useWorkspaceNavigation({
    initialView,
    routeTripId,
    tripId,
  });

  const navigateWorkspaceView = useCallback(
    (view: PlanningView, href: string) => {
      navigateWorkspacePath(view, href);
      setContextRailVisibility(false);
    },
    [navigateWorkspacePath, setContextRailVisibility],
  );

  const openExpensesWorkspace = useCallback(() => {
    navigateWorkspaceView("expenses", appRoutes.tripExpenses(tripId));
  }, [navigateWorkspaceView, tripId]);

  return {
    currentView,
    navigateWorkspaceView,
    openExpensesWorkspace,
    replaceWorkspacePath,
    supportsContextRail: workspaceViewSupportsContextRail(currentView),
  };
}
