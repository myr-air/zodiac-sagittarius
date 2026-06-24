import { describe, expect, it } from "vitest";
import {
  initialWorkspaceChromeState,
  workspaceChromeContextRailUnmountedState,
  workspaceChromeContextRailVisibilityState,
  workspaceChromePreferredTabState,
  workspaceChromeSidebarToggledState,
  workspaceChromeToastDismissedState,
  workspaceChromeToastDismissingState,
} from "../workspace-chrome-state";

describe("workspace chrome state", () => {
  it("opens and closes the context rail without unmounting it immediately", () => {
    const opened = workspaceChromeContextRailVisibilityState(
      initialWorkspaceChromeState(),
      true,
    );

    expect(opened).toEqual(expect.objectContaining({
      contextRailMounted: true,
      contextRailOpen: true,
    }));

    const closed = workspaceChromeContextRailVisibilityState(opened, false);
    expect(closed).toEqual(expect.objectContaining({
      contextRailMounted: true,
      contextRailOpen: false,
    }));
    expect(workspaceChromeContextRailUnmountedState(closed)).toEqual(
      expect.objectContaining({
        contextRailMounted: false,
        contextRailOpen: false,
      }),
    );
  });

  it("tracks sidebar, preferred tab, and toast dismissal state", () => {
    const state = workspaceChromePreferredTabState(
      workspaceChromeSidebarToggledState(initialWorkspaceChromeState()),
      "booking",
    );
    const dismissing = workspaceChromeToastDismissingState(state);
    const dismissed = workspaceChromeToastDismissedState(dismissing);

    expect(dismissed).toEqual(expect.objectContaining({
      contextRailPreferredTab: "booking",
      sidebarCollapsed: true,
      toastDismissed: true,
      toastDismissing: true,
    }));
  });
});
