import { describe, expect, it } from "vitest";
import { frontendRoot } from "../../project/contracts/project-contract.helpers";
import { readWorkspaceBoundarySources } from "./workspace-source-boundaries.sources";

describe("Sagittarius workspace media and expense command hook boundaries", () => {
  it("keeps photo album and expense command orchestration split from drafts and domain helpers", () => {
    const {
      photoAlbumsHook,
      photoAlbumApiCommands,
      photoAlbumLocalCommands,
      photoAlbumsDomain,
      photoAlbumApi,
      photoAlbumLocal,
      photoAlbumQuery,
      expenseMutationCommands,
      expenseMutationCommandTypes,
      createExpenseCommand,
      deleteExpenseCommand,
      updateExpenseCommand,
      expenseDrafts,
    } = readWorkspaceBoundarySources(frontendRoot);

    expect(photoAlbumsHook).toContain("normalizePhotoAlbumCreateInput");
    expect(photoAlbumsHook).toContain("useWorkspaceApiPhotoAlbumCommands");
    expect(photoAlbumsHook).toContain("useWorkspaceLocalPhotoAlbumCommands");
    expect(photoAlbumsHook).not.toContain("const title = input.title.trim()");
    expect(photoAlbumsHook).not.toContain("const url = input.url.trim()");
    expect(photoAlbumApiCommands).toContain("isVersionConflict");
    expect(photoAlbumApiCommands).toContain("buildCreatePhotoAlbumRequest");
    expect(photoAlbumApiCommands).toContain("buildPatchPhotoAlbumRequest");
    expect(photoAlbumLocalCommands).toContain("createLocalPhotoAlbum");
    expect(photoAlbumLocalCommands).toContain("updateLocalPhotoAlbumInTrip");
    expect(photoAlbumsDomain).toContain("./photo-album-api");
    expect(photoAlbumsDomain).toContain("./photo-album-local");
    expect(photoAlbumsDomain).toContain("./photo-album-query");
    expect(photoAlbumApi).toContain("serializePhotoAlbumInputForApi");
    expect(photoAlbumLocal).toContain("normalizePhotoAlbumCreateInput");
    expect(photoAlbumLocal).toContain("createLocalPhotoAlbum");
    expect(photoAlbumQuery).toContain("buildPhotoAlbumSummary");
    expect(expenseMutationCommands).toContain("useCreateWorkspaceExpenseCommand");
    expect(expenseMutationCommands).toContain("useDeleteWorkspaceExpenseCommand");
    expect(expenseMutationCommands).toContain("useUpdateWorkspaceExpenseCommand");
    expect(expenseMutationCommands).not.toContain(
      "resolveExpenseCreateDraftTripPlanId",
    );
    expect(expenseMutationCommands).not.toContain("buildExpenseUpdateDraft");
    expect(expenseMutationCommandTypes).toContain("UseWorkspaceExpenseMutationCommandsOptions");
    expect(createExpenseCommand).toContain("buildExpenseCreateDrafts");
    expect(createExpenseCommand).toContain(
      "resolveExpenseCreateDraftTripPlanId",
    );
    expect(deleteExpenseCommand).toContain("removeExpenseFromTrip");
    expect(updateExpenseCommand).toContain("buildExpenseUpdateDraft");
    expect(updateExpenseCommand).toContain("buildPatchExpenseRequest");
    expect(expenseDrafts).toContain("resolveExpenseCreateDraftTripPlanId");
  });
});
