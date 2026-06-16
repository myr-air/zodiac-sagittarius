import { useCallback, useEffect, useState } from "react";
import { resolveViewFromPath } from "@/src/components/AppShell";
import type { PlanningView } from "@/src/trip/workspace/planning-view";

interface UseWorkspaceNavigationOptions {
  initialView: PlanningView;
  routeTripId?: string;
  tripId: string;
}

export function useWorkspaceNavigation({
  initialView,
  routeTripId,
  tripId,
}: UseWorkspaceNavigationOptions) {
  const [navigatedView, setNavigatedView] = useState<PlanningView | null>(null);
  const tripIdForPath = routeTripId ?? tripId;
  const resolveCurrentView = useCallback(() => {
    if (typeof window === "undefined") return initialView;
    return resolveViewFromPath(
      window.location.pathname,
      tripIdForPath,
      initialView,
    );
  }, [initialView, tripIdForPath]);
  const currentView = navigatedView ?? resolveCurrentView();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onPopState = () => setNavigatedView(resolveCurrentView());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [resolveCurrentView]);

  const navigateWorkspacePath = useCallback(
    (view: PlanningView, href: string) => {
      setNavigatedView(view);
      if (typeof window !== "undefined" && window.location.pathname !== href) {
        window.history.pushState(null, "", href);
      }
    },
    [],
  );

  const replaceWorkspacePath = useCallback(
    (href: string, nextTripId: string = tripIdForPath) => {
      if (typeof window === "undefined") return;
      window.history.replaceState(null, "", href);
      const postAuthPath = new URL(href, window.location.origin).pathname;
      setNavigatedView(
        resolveViewFromPath(postAuthPath, nextTripId, initialView),
      );
    },
    [initialView, tripIdForPath],
  );

  return {
    currentView,
    navigateWorkspacePath,
    replaceWorkspacePath,
    tripIdForPath,
  };
}
