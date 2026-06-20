import { describe, expect, it } from "vitest";
import {
  deleteLocalStopNote,
  updateLocalStopNote,
} from "./stop-notes";
import { stopNote } from "./stop-notes.test-support";

describe("stop note permissions", () => {
  it("updates notes only for the author or members with edit access", () => {
    const notes = [
      stopNote({ id: "note-aom", authorId: "member-aom", body: "Original" }),
      stopNote({ id: "note-beam", authorId: "member-beam", body: "Keep" }),
    ];

    expect(
      updateLocalStopNote(notes, "note-aom", "Updated", {
        currentMemberId: "member-aom",
        canEdit: false,
      }),
    ).toEqual([
      expect.objectContaining({ id: "note-aom", body: "Updated" }),
      expect.objectContaining({ id: "note-beam", body: "Keep" }),
    ]);

    expect(
      updateLocalStopNote(notes, "note-beam", "Blocked", {
        currentMemberId: "member-aom",
        canEdit: false,
      })[1].body,
    ).toBe("Keep");
    expect(
      updateLocalStopNote(notes, "note-beam", "Organizer edit", {
        currentMemberId: "member-aom",
        canEdit: true,
      })[1].body,
    ).toBe("Organizer edit");
  });

  it("deletes notes only for the author or members with edit access", () => {
    const notes = [
      stopNote({ id: "note-aom", authorId: "member-aom" }),
      stopNote({ id: "note-beam", authorId: "member-beam" }),
    ];

    expect(
      deleteLocalStopNote(notes, "note-beam", {
        currentMemberId: "member-aom",
        canEdit: false,
      }).map((note) => note.id),
    ).toEqual(["note-aom", "note-beam"]);
    expect(
      deleteLocalStopNote(notes, "note-beam", {
        currentMemberId: "member-aom",
        canEdit: true,
      }).map((note) => note.id),
    ).toEqual(["note-aom"]);
  });
});
