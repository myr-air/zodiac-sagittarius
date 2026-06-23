import { useState } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ItineraryAsyncVoidResult } from "../itinerary-action.types";
import {
  initialDayTitleEditorState,
  updateDayTitleEditorDraft,
} from "../day-title-editor-state";
import { useDayTitleEditorActions } from "../use-day-title-editor-actions";

type SaveDayTitle = (
  date: string,
  version: number,
  title: string | null,
) => ItineraryAsyncVoidResult;

function createHook(options: {
  canEdit?: boolean;
  onSaveDayTitle?: SaveDayTitle;
  title?: string;
} = {}) {
  const onSaveDayTitle = options.onSaveDayTitle ?? vi.fn<SaveDayTitle>();
  const hook = renderHook(() => {
    const [state, setState] = useState(() =>
      initialDayTitleEditorState(options.title ?? "Old title", 50),
    );
    const actions = useDayTitleEditorActions({
      canEdit: options.canEdit ?? true,
      date: "2026-06-19",
      defaultTitle: "Day 2",
      onSaveDayTitle,
      setState,
      state,
      version: 7,
    });

    return {
      ...actions,
      setState,
      state,
    };
  });

  return { ...hook, onSaveDayTitle };
}

describe("useDayTitleEditorActions", () => {
  it("saves trimmed titles and updates the source title", async () => {
    const { result, onSaveDayTitle } = createHook();

    await act(async () => {
      await result.current.commit("  Shenzhen border hop  ");
    });

    expect(onSaveDayTitle).toHaveBeenCalledWith(
      "2026-06-19",
      7,
      "Shenzhen border hop",
    );
    expect(result.current.state).toEqual({
      draft: "Shenzhen border hop",
      saving: false,
      sourceTitle: "Shenzhen border hop",
    });
  });

  it("saves blank titles as null and displays the default title", async () => {
    const { result, onSaveDayTitle } = createHook();

    await act(async () => {
      await result.current.commit("   ");
    });

    expect(onSaveDayTitle).toHaveBeenCalledWith("2026-06-19", 7, null);
    expect(result.current.state).toMatchObject({
      draft: "Day 2",
      sourceTitle: "Day 2",
    });
  });

  it("reverts unchanged normalized titles without saving", async () => {
    const { result, onSaveDayTitle } = createHook();

    act(() => {
      result.current.setState((current) =>
        updateDayTitleEditorDraft(current, "  Old title  "),
      );
    });
    await act(async () => {
      await result.current.commit(result.current.state.draft);
    });

    expect(onSaveDayTitle).not.toHaveBeenCalled();
    expect(result.current.state.draft).toBe("Old title");
  });

  it("suppresses the blur commit after reverting with Escape", async () => {
    const { result, onSaveDayTitle } = createHook();

    act(() => {
      result.current.setState((current) =>
        updateDayTitleEditorDraft(current, "Draft title"),
      );
      result.current.revertWithoutCommit();
    });
    await act(async () => {
      await result.current.commit(result.current.state.draft);
    });

    await waitFor(() => {
      expect(result.current.state.draft).toBe("Old title");
    });
    expect(onSaveDayTitle).not.toHaveBeenCalled();
  });
});
