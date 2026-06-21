import { describe, expect, it } from "vitest";
import { frontendRoot } from "../../project/contracts/project-contract.helpers";
import { readWorkspaceBoundarySources } from "./workspace-source-boundaries.sources";

describe("Sagittarius workspace hook source boundaries", () => {
  it("keeps workspace setup, data, and navigation hooks split by responsibility", () => {
    const {
      sagaCore,
      workspaceContextsHook,
      accessContextHook,
      uiStateHook,
      apiClientsHook,
      setupContextHook,
      setupContextParams,
      dataContextHook,
      backendExpenseSummaryHook,
      memberContextHook,
      navigationContextHook,
    } = readWorkspaceBoundarySources(frontendRoot);

    expect(sagaCore).toContain("useSagittariusWorkspaceContexts");
    expect(sagaCore).not.toContain("useWorkspaceSetupContext");
    expect(workspaceContextsHook).toContain("useWorkspaceSetupContext");
    expect(workspaceContextsHook).toContain("UseWorkspaceSetupContextParams");
    expect(workspaceContextsHook).not.toContain("type UseSagittariusWorkspaceContextsParams");
    expect(setupContextHook).toContain("useWorkspaceUiState");
    expect(setupContextHook).toContain("UseWorkspaceSetupContextParams");
    expect(setupContextHook).not.toContain("type UseWorkspaceSetupContextParams");
    expect(setupContextParams).toContain("export type UseWorkspaceSetupContextParams");
    expect(sagaCore).not.toContain("useState");
    expect(uiStateHook).toContain("export function useWorkspaceUiState");
    expect(uiStateHook).toContain("useState");
    expect(sagaCore).not.toContain("useWorkspaceApiClients");
    expect(setupContextHook).toContain("useWorkspaceApiClients");
    expect(sagaCore).not.toContain("createConfiguredTripApiClient");
    expect(sagaCore).not.toContain("createConfiguredAccountApiClient");
    expect(sagaCore).not.toContain("publicSagittariusApiBaseUrl");
    expect(apiClientsHook).toContain("createConfiguredTripApiClient");
    expect(apiClientsHook).toContain("createConfiguredAccountApiClient");
    expect(apiClientsHook).toContain("publicSagittariusApiBaseUrl");
    expect(sagaCore).not.toContain("useWorkspaceAccessContext");
    expect(setupContextHook).toContain("useWorkspaceAccessContext");
    expect(sagaCore).not.toContain("useWorkspaceMemberContext");
    expect(accessContextHook).toContain("useWorkspaceMemberContext");
    expect(accessContextHook).toContain("deriveWorkspacePermissions");
    expect(accessContextHook).toContain("useWorkspaceAccessGate");
    expect(sagaCore).not.toContain("findSessionMember");
    expect(sagaCore).not.toContain("isLocalParticipantSession");
    expect(memberContextHook).toContain("findSessionMember");
    expect(memberContextHook).toContain("isLocalParticipantSession");
    expect(sagaCore).not.toContain("useWorkspaceNavigationContext");
    expect(setupContextHook).toContain("useWorkspaceNavigationContext");
    expect(sagaCore).not.toContain("@/src/trip/workspace/use-workspace-navigation");
    expect(sagaCore).not.toContain("workspaceViewSupportsContextRail");
    expect(sagaCore).not.toContain("appRoutes.tripExpenses");
    expect(navigationContextHook).toContain("useWorkspaceNavigation");
    expect(navigationContextHook).toContain("workspaceViewSupportsContextRail");
    expect(navigationContextHook).toContain("appRoutes.tripExpenses");
    expect(sagaCore).not.toContain("useWorkspaceBackendExpenseSummary");
    expect(setupContextHook).toContain("useWorkspaceDataContext");
    expect(dataContextHook).toContain("useWorkspaceBackendExpenseSummary");
    expect(dataContextHook).toContain("useWorkspacePhotoAlbums");
    expect(dataContextHook).toContain("useDailyBriefings");
    expect(sagaCore).not.toContain("useBackendExpenseSummary");
    expect(sagaCore).not.toContain("workspaceViewShouldSyncBackendExpenseSummary");
    expect(backendExpenseSummaryHook).toContain("useBackendExpenseSummary");
    expect(backendExpenseSummaryHook).toContain("workspaceViewShouldSyncBackendExpenseSummary");
    expect(backendExpenseSummaryHook).toContain("clearParticipantSession");
    expect(sagaCore).toContain("./hooks");
    expect(sagaCore).not.toContain("@/src/trip/workspace/use-trip-workspace-state");
    expect(sagaCore).not.toContain("@/src/trip/workspace/use-workspace-chrome");
    expect(setupContextHook).toContain("@/src/trip/workspace/use-trip-workspace-state");
    expect(setupContextHook).toContain("@/src/trip/workspace/use-workspace-chrome");
    expect(sagaCore).not.toContain("@/src/trip/workspace/use-workspace-navigation");
    expect(navigationContextHook).toContain("@/src/trip/workspace/use-workspace-navigation");
  });
});
