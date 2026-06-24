import { describe, expect, it } from "vitest";
import {
  buildCreateStopNoteRequest,
  buildPatchStopNoteRequest,
} from "../../records";
import { stopNote } from "./stop-notes.test-support";

describe("stop note API requests", () => {
  it("builds API create stop note requests from note input", () => {
    expect(
      buildCreateStopNoteRequest(
        {
          itemId: "item-peak",
          body: "Bring jackets.",
        },
        {
          clientMutationId: "mutation-stop-note-create",
          tripPlanId: "plan-main",
        },
      ),
    ).toEqual({
      clientMutationId: "mutation-stop-note-create",
      itineraryItemId: "item-peak",
      tripPlanId: "plan-main",
      body: "Bring jackets.",
    });
  });

  it("builds API patch stop note requests with version fallback", () => {
    expect(
      buildPatchStopNoteRequest(
        stopNote({ id: "note-versioned", version: 12 }),
        "Updated note",
        { clientMutationId: "mutation-stop-note-patch" },
      ),
    ).toEqual({
      clientMutationId: "mutation-stop-note-patch",
      expectedVersion: 12,
      body: "Updated note",
    });

    expect(
      buildPatchStopNoteRequest(
        stopNote({ id: "note-unversioned" }),
        "Fallback version note",
        { clientMutationId: "mutation-stop-note-patch-fallback" },
      ),
    ).toEqual({
      clientMutationId: "mutation-stop-note-patch-fallback",
      expectedVersion: 1,
      body: "Fallback version note",
    });
  });
});
