import { describe, expect, it } from "vitest";
import {
  appendStopNote,
  createLocalStopNote,
  createLocalStopNoteInList,
  deleteLocalStopNote,
  removeStopNote,
  replaceStopNote,
  updateLocalStopNote,
} from "./stop-notes";
import type { StopNote, Trip } from "./types";

const trip = { id: "trip-1" } as Pick<Trip, "id">;

describe("stop note helpers", () => {
  it("builds local stop notes from app-provided context", () => {
    expect(
      createLocalStopNote(
        trip,
        [stopNote({ id: "note-existing" })],
        {
          itemId: "item-peak",
          tripPlanId: "plan-main",
          body: "Bring jackets for the peak tram queue.",
        },
        {
          authorId: "member-aom",
          createdAt: "2026-06-18T10:00:00.000Z",
          nextStopNoteId: (notes) => `note-local-${notes.length + 1}`,
        },
      ),
    ).toEqual({
      id: "note-local-2",
      tripId: "trip-1",
      tripPlanId: "plan-main",
      itemId: "item-peak",
      authorId: "member-aom",
      body: "Bring jackets for the peak tram queue.",
      createdAt: "2026-06-18T10:00:00.000Z",
    });
  });

  it("appends, creates, replaces, and removes stop notes in app state lists", () => {
    const notes = [
      stopNote({ id: "note-existing", body: "Original existing note" }),
    ];
    const created = createLocalStopNoteInList(
      trip,
      notes,
      {
        itemId: "item-peak",
        tripPlanId: "plan-main",
        body: "Bring jackets.",
      },
      {
        authorId: "member-aom",
        createdAt: "2026-06-18T10:00:00.000Z",
        nextStopNoteId: (currentNotes) => `note-local-${currentNotes.length + 1}`,
      },
    );

    expect(created).toEqual([
      expect.objectContaining({
        id: "note-existing",
        body: "Original existing note",
      }),
      expect.objectContaining({ id: "note-local-2", body: "Bring jackets." }),
    ]);
    expect(notes).toEqual([
      expect.objectContaining({
        id: "note-existing",
        body: "Original existing note",
      }),
    ]);

    expect(appendStopNote(notes, stopNote({ id: "note-manual" }))).toEqual([
      expect.objectContaining({ id: "note-existing" }),
      expect.objectContaining({ id: "note-manual" }),
    ]);

    expect(
      replaceStopNote(
        created,
        stopNote({ id: "note-existing", body: "Updated existing note" }),
      ),
    ).toEqual([
      expect.objectContaining({
        id: "note-existing",
        body: "Updated existing note",
      }),
      expect.objectContaining({ id: "note-local-2", body: "Bring jackets." }),
    ]);

    expect(removeStopNote(created, "note-existing")).toEqual([
      expect.objectContaining({ id: "note-local-2" }),
    ]);
  });

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

function stopNote(input: Partial<StopNote> & Pick<StopNote, "id">): StopNote {
  return {
    tripId: "trip-1",
    tripPlanId: "plan-main",
    itemId: "item-peak",
    authorId: "member-aom",
    body: "Original note",
    createdAt: "2026-06-18T09:00:00.000Z",
    ...input,
  };
}
