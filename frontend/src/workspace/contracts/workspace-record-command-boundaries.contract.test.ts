import { describe, expect, it } from "vitest";
import { frontendRoot } from "../../project/contracts/project-contract.helpers";
import { readWorkspaceBoundarySources } from "./workspace-source-boundaries.sources";

describe("Sagittarius workspace record command source boundaries", () => {
  it("keeps task, suggestion, stop note, and shared record inputs split by responsibility", () => {
    const {
      sagaCore,
      taskActionsHook,
      taskCommandTypes,
      createTaskCommand,
      toggleTaskStatusCommand,
      suggestionActionsHook,
      suggestionCommandTypes,
      suggestSelectedStopCommand,
      reviewSuggestionCommand,
      stopNoteActionsHook,
      stopNoteCommandTypes,
      createStopNoteCommand,
      updateStopNoteCommand,
      deleteStopNoteCommand,
      recordCommandInputs,
    } = readWorkspaceBoundarySources(frontendRoot);

    expect(sagaCore).not.toContain("useWorkspaceRecordState");
    expect(sagaCore).not.toContain("useWorkspaceRecordActions");
    expect(taskActionsHook).toContain("useCreateWorkspaceTaskCommand");
    expect(taskActionsHook).toContain("useToggleWorkspaceTaskStatusCommand");
    expect(taskActionsHook).not.toContain("buildWorkspaceTaskCreateDraft");
    expect(taskActionsHook).not.toContain("buildToggleTaskStatusRequest");
    expect(taskCommandTypes).toContain("WorkspaceTaskCommandBaseParams");
    expect(createTaskCommand).toContain("buildWorkspaceTaskCreateDraft");
    expect(createTaskCommand).toContain("buildCreateTaskRequest");
    expect(toggleTaskStatusCommand).toContain("buildToggleTaskStatusRequest");
    expect(taskActionsHook).not.toContain("tripPlanIdForRecord");
    expect(suggestionActionsHook).toContain("useSuggestSelectedStopCommand");
    expect(suggestionActionsHook).toContain("useReviewWorkspaceSuggestionCommand");
    expect(suggestionActionsHook).not.toContain("buildCreateEditSuggestionRequest");
    expect(suggestionActionsHook).not.toContain("approveSuggestion");
    expect(suggestionCommandTypes).toContain("WorkspaceSuggestionCommandBaseParams");
    expect(suggestSelectedStopCommand).toContain(
      "buildCreateEditSuggestionRequest",
    );
    expect(suggestSelectedStopCommand).toContain("createLocalEditSuggestion");
    expect(reviewSuggestionCommand).toContain("approveSuggestion");
    expect(reviewSuggestionCommand).toContain("rejectSuggestionById");
    expect(stopNoteActionsHook).toContain("useCreateWorkspaceStopNoteCommand");
    expect(stopNoteActionsHook).toContain("useUpdateWorkspaceStopNoteCommand");
    expect(stopNoteActionsHook).toContain("useDeleteWorkspaceStopNoteCommand");
    expect(stopNoteActionsHook).not.toContain("buildWorkspaceStopNoteCreateInput");
    expect(stopNoteActionsHook).not.toContain("buildPatchStopNoteRequest");
    expect(stopNoteCommandTypes).toContain("WorkspaceStopNoteCommandBaseParams");
    expect(createStopNoteCommand).toContain("buildWorkspaceStopNoteCreateInput");
    expect(createStopNoteCommand).toContain("buildCreateStopNoteRequest");
    expect(updateStopNoteCommand).toContain("buildPatchStopNoteRequest");
    expect(deleteStopNoteCommand).toContain("deleteLocalStopNote");
    expect(stopNoteActionsHook).not.toContain("tripPlanIdForRecord");
    expect(recordCommandInputs).toContain("tripPlanIdForRecord");
  });
});
