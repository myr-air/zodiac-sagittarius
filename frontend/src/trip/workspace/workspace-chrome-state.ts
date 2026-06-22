import type { WorkspaceContextRailTab } from "./context-rail-tabs";

export interface WorkspaceChromeState {
  contextRailMounted: boolean;
  contextRailOpen: boolean;
  contextRailPreferredTab: WorkspaceContextRailTab;
  sidebarCollapsed: boolean;
  toastDismissed: boolean;
  toastDismissing: boolean;
}

export function initialWorkspaceChromeState(): WorkspaceChromeState {
  return {
    contextRailMounted: false,
    contextRailOpen: false,
    contextRailPreferredTab: "notes",
    sidebarCollapsed: false,
    toastDismissed: false,
    toastDismissing: false,
  };
}

export function workspaceChromeContextRailVisibilityState(
  state: WorkspaceChromeState,
  open: boolean,
): WorkspaceChromeState {
  return {
    ...state,
    contextRailMounted: open ? true : state.contextRailMounted,
    contextRailOpen: open,
  };
}

export function workspaceChromeContextRailUnmountedState(
  state: WorkspaceChromeState,
): WorkspaceChromeState {
  return {
    ...state,
    contextRailMounted: false,
  };
}

export function workspaceChromePreferredTabState(
  state: WorkspaceChromeState,
  contextRailPreferredTab: WorkspaceContextRailTab,
): WorkspaceChromeState {
  return {
    ...state,
    contextRailPreferredTab,
  };
}

export function workspaceChromeSidebarToggledState(
  state: WorkspaceChromeState,
): WorkspaceChromeState {
  return {
    ...state,
    sidebarCollapsed: !state.sidebarCollapsed,
  };
}

export function workspaceChromeToastDismissingState(
  state: WorkspaceChromeState,
): WorkspaceChromeState {
  return {
    ...state,
    toastDismissing: true,
  };
}

export function workspaceChromeToastDismissedState(
  state: WorkspaceChromeState,
): WorkspaceChromeState {
  return {
    ...state,
    toastDismissed: true,
  };
}
