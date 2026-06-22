import { describe, expect, it } from "vitest";
import type { StopNote } from "@/src/trip/types";

import {
  buildContextRailNoteCreateSubmission,
  buildContextRailNoteEditSubmission,
  cancelContextRailEditingNote,
  clearContextRailEditingNote,
  clearContextRailNoteBody,
  initialContextRailNoteFormState,
  startContextRailEditingNote,
  updateContextRailEditingNoteBody,
  updateContextRailNoteBody,
} from "../context-rail-note-form-state";

const note: StopNote = {
  authorId: "member-beam",
  body: "Queue plan",
  createdAt: "2026-01-02T03:04:05.000Z",
  id: "note-dimdim-1",
  itemId: "item-dimdim",
  tripId: "trip-hong-kong",
  version: 1,
};

describe("context rail note form state", () => {
  it("updates and trims create note submissions", () => {
    const state = updateContextRailNoteBody(
      initialContextRailNoteFormState,
      "  call restaurant  ",
    );

    expect(buildContextRailNoteCreateSubmission(state)).toEqual({
      body: "call restaurant",
    });
    expect(clearContextRailNoteBody(state).noteBody).toBe("");
  });

  it("ignores blank create note submissions", () => {
    expect(
      buildContextRailNoteCreateSubmission(
        updateContextRailNoteBody(initialContextRailNoteFormState, "   "),
      ),
    ).toBeNull();
  });

  it("starts and cancels editing without clearing the draft body", () => {
    const editing = startContextRailEditingNote(
      initialContextRailNoteFormState,
      note,
    );

    expect(editing).toEqual({
      editingNoteBody: "Queue plan",
      editingNoteId: "note-dimdim-1",
      noteBody: "",
    });
    expect(cancelContextRailEditingNote(editing)).toEqual({
      editingNoteBody: "Queue plan",
      editingNoteId: null,
      noteBody: "",
    });
  });

  it("builds edit submissions and clears edit state", () => {
    const editing = updateContextRailEditingNoteBody(
      startContextRailEditingNote(initialContextRailNoteFormState, note),
      "  Updated queue plan  ",
    );

    expect(buildContextRailNoteEditSubmission(editing)).toEqual({
      body: "Updated queue plan",
      noteId: "note-dimdim-1",
    });
    expect(clearContextRailEditingNote(editing)).toEqual({
      editingNoteBody: "",
      editingNoteId: null,
      noteBody: "",
    });
  });

  it("ignores edit submissions without note id or body", () => {
    expect(
      buildContextRailNoteEditSubmission(
        updateContextRailEditingNoteBody(
          initialContextRailNoteFormState,
          "Updated",
        ),
      ),
    ).toBeNull();
    expect(
      buildContextRailNoteEditSubmission(
        updateContextRailEditingNoteBody(
          startContextRailEditingNote(initialContextRailNoteFormState, note),
          "   ",
        ),
      ),
    ).toBeNull();
  });
});
