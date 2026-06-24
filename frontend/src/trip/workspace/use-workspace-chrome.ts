import { useCallback, useEffect, useState } from "react";
import type { WorkspaceContextRailTab } from "./context-rail-tabs";
import {
  initialWorkspaceChromeState,
  workspaceChromeContextRailUnmountedState,
  workspaceChromeContextRailVisibilityState,
  workspaceChromePreferredTabState,
  workspaceChromeSidebarToggledState,
  workspaceChromeToastDismissedState,
  workspaceChromeToastDismissingState,
} from "./workspace-chrome-state";

interface UseWorkspaceChromeOptions {
  autoDismissToast: boolean;
}

export function useWorkspaceChrome({
  autoDismissToast,
}: UseWorkspaceChromeOptions) {
  const [chromeState, setChromeState] = useState(initialWorkspaceChromeState);

  useEffect(() => {
    if (chromeState.contextRailOpen) return undefined;
    const timeout = window.setTimeout(() => {
      setChromeState(workspaceChromeContextRailUnmountedState);
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [chromeState.contextRailOpen]);

  const setContextRailVisibility = useCallback((open: boolean) => {
    setChromeState((current) =>
      workspaceChromeContextRailVisibilityState(current, open),
    );
  }, []);

  const setContextRailPreferredTab = useCallback((
    tab: WorkspaceContextRailTab,
  ) => {
    setChromeState((current) => workspaceChromePreferredTabState(current, tab));
  }, []);

  const toggleSidebarCollapsed = useCallback(() => {
    setChromeState(workspaceChromeSidebarToggledState);
  }, []);

  const toggleContextRail = useCallback(() => {
    setContextRailVisibility(!chromeState.contextRailOpen);
  }, [chromeState.contextRailOpen, setContextRailVisibility]);

  const dismissWorkspaceToast = useCallback(() => {
    setChromeState(workspaceChromeToastDismissingState);
    setTimeout(() => {
      setChromeState(workspaceChromeToastDismissedState);
    }, 220);
  }, []);

  useEffect(() => {
    if (!autoDismissToast || chromeState.toastDismissed) return;
    const timer = setTimeout(dismissWorkspaceToast, 6000);
    return () => clearTimeout(timer);
  }, [autoDismissToast, dismissWorkspaceToast, chromeState.toastDismissed]);

  useEffect(() => {
    if (!chromeState.contextRailOpen) return undefined;

    function closeContextRailFromOutside(event: Event) {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest(".context-rail")) return;
      if (event.target.closest(".page-header, .side-rail")) return;
      if (event.target.closest('[role="dialog"]')) return;
      if (event.target.closest(".data-row")) return;
      setContextRailVisibility(false);
    }

    document.addEventListener("pointerdown", closeContextRailFromOutside);
    document.addEventListener("click", closeContextRailFromOutside);
    return () => {
      document.removeEventListener("pointerdown", closeContextRailFromOutside);
      document.removeEventListener("click", closeContextRailFromOutside);
    };
  }, [chromeState.contextRailOpen, setContextRailVisibility]);

  return {
    contextRailMounted: chromeState.contextRailMounted,
    contextRailOpen: chromeState.contextRailOpen,
    contextRailPreferredTab: chromeState.contextRailPreferredTab,
    dismissWorkspaceToast,
    setContextRailPreferredTab,
    setContextRailVisibility,
    sidebarCollapsed: chromeState.sidebarCollapsed,
    toggleContextRail,
    toggleSidebarCollapsed,
    toastDismissed: chromeState.toastDismissed,
    toastDismissing: chromeState.toastDismissing,
  };
}
