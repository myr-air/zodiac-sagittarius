import { describe, expect, it } from "vitest";
import { frontendRoot } from "../../project-contract.helpers";
import { readWorkspaceBoundarySources } from "./workspace-source-boundaries.sources";

describe("Sagittarius workspace session hook source boundaries", () => {
  it("keeps access, participant navigation, and session restore logic split by responsibility", () => {
    const {
      accessGateHook,
      accountSessionHook,
      accessState,
      participantSessionActions,
      participantSessionRestoreHook,
      participantPostAuthNavigation,
      workspaceSessionHook,
      workspaceSessionRestore,
    } = readWorkspaceBoundarySources(frontendRoot);

    expect(accessGateHook).toContain("resolveWorkspaceAccessState");
    expect(accessState).toContain("shouldRedirectUnauthenticatedTripRoute");
    expect(participantSessionActions).toContain("resolveParticipantPostAuthHref");
    expect(participantSessionActions).not.toContain("decodeReturnTo");
    expect(participantPostAuthNavigation).toContain("resolveJoinPostAuthReturnTo");
    expect(workspaceSessionHook).toContain("useWorkspaceAccountSession");
    expect(workspaceSessionHook).not.toContain("loadPersistedAccountSession");
    expect(workspaceSessionHook).not.toContain("persistAccountSession");
    expect(accountSessionHook).toContain("loadPersistedAccountSession");
    expect(accountSessionHook).toContain("persistAccountSession");
    expect(workspaceSessionHook).toContain("useWorkspaceParticipantSessionRestore");
    expect(workspaceSessionHook).not.toContain("loadPersistedParticipantSession");
    expect(workspaceSessionHook).not.toContain("resolveWorkspaceSessionRestore");
    expect(participantSessionRestoreHook).toContain("loadPersistedParticipantSession");
    expect(participantSessionRestoreHook).toContain("resolveWorkspaceSessionRestore");
    expect(workspaceSessionHook).not.toContain("normalizeTripPlanAliases");
    expect(workspaceSessionRestore).toContain("normalizeTripPlanAliases");
    expect(workspaceSessionRestore).toContain("resolveSelectedTripPlanId");
  });
});
