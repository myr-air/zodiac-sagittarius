import type { FormEvent } from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { StopNote } from "@/src/trip/types";
import { useContextRailNoteForm } from "../use-context-rail-note-form";

function createHook(options: { itemId?: string } = {}) {
  const onCreateNote = vi.fn();
  const onUpdateNote = vi.fn();
  const hook = renderHook(() =>
    useContextRailNoteForm({
      itemId: options.itemId,
      onCreateNote,
      onUpdateNote,
    }),
  );

  return { ...hook, onCreateNote, onUpdateNote };
}

function submitCreate(result: ReturnType<typeof createHook>["result"]) {
  act(() => {
    result.current.submitNote({
      preventDefault: vi.fn(),
    } as unknown as FormEvent<HTMLFormElement>);
  });
}

function submitEdit(result: ReturnType<typeof createHook>["result"]) {
  act(() => {
    result.current.submitNoteEdit({
      preventDefault: vi.fn(),
    } as unknown as FormEvent<HTMLFormElement>);
  });
}

describe("useContextRailNoteForm", () => {
  it("creates notes with trimmed body and resets the create form", () => {
    const { result, onCreateNote, onUpdateNote } = createHook({
      itemId: "item-dimdim",
    });

    act(() => {
      result.current.setNoteBody("  call restaurant  ");
    });
    submitCreate(result);

    expect(onCreateNote).toHaveBeenCalledWith({
      itemId: "item-dimdim",
      body: "call restaurant",
    });
    expect(onUpdateNote).not.toHaveBeenCalled();
    expect(result.current.noteBody).toBe("");
  });

  it("ignores blank note bodies and missing selected item ids", () => {
    const withoutItem = createHook();
    const withItem = createHook({ itemId: "item-dimdim" });

    act(() => {
      withoutItem.result.current.setNoteBody("ready");
      withItem.result.current.setNoteBody("   ");
    });
    submitCreate(withoutItem.result);
    submitCreate(withItem.result);

    expect(withoutItem.onCreateNote).not.toHaveBeenCalled();
    expect(withItem.onCreateNote).not.toHaveBeenCalled();
  });

  it("updates the active edited note with trimmed body and exits edit mode", () => {
    const { result, onCreateNote, onUpdateNote } = createHook({
      itemId: "item-dimdim",
    });
    const note: StopNote = {
      id: "note-dimdim-1",
      tripId: "trip-hong-kong",
      itemId: "item-dimdim",
      authorId: "member-beam",
      body: "Queue plan",
      createdAt: "2026-01-02T03:04:05.000Z",
      version: 1,
    };

    act(() => {
      result.current.startEditingNote(note);
      result.current.setEditingNoteBody("  Updated queue plan  ");
    });
    submitEdit(result);

    expect(onUpdateNote).toHaveBeenCalledWith({
      noteId: "note-dimdim-1",
      body: "Updated queue plan",
    });
    expect(onCreateNote).not.toHaveBeenCalled();
    expect(result.current.editingNoteId).toBeNull();
    expect(result.current.editingNoteBody).toBe("");
  });

  it("can cancel editing without clearing the draft body", () => {
    const { result } = createHook();
    const note: StopNote = {
      id: "note-dimdim-1",
      tripId: "trip-hong-kong",
      itemId: "item-dimdim",
      authorId: "member-beam",
      body: "Queue plan",
      createdAt: "2026-01-02T03:04:05.000Z",
      version: 1,
    };

    act(() => {
      result.current.startEditingNote(note);
      result.current.cancelEditingNote();
    });

    expect(result.current.editingNoteId).toBeNull();
    expect(result.current.editingNoteBody).toBe("Queue plan");
  });
});
