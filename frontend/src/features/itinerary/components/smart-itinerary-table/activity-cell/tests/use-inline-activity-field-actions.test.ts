import { useState } from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ItineraryAsyncVoidResult } from "../../itinerary-action.types";
import {
  initialInlineActivityFieldState,
  updateInlineActivityFieldDraft,
} from "../inline-activity-field-state";
import { useInlineActivityFieldActions } from "../use-inline-activity-field-actions";

type CommitInlineValue = (value: string) => ItineraryAsyncVoidResult;

function createHook(options: {
  disabled?: boolean;
  onCommit?: CommitInlineValue;
  value?: string;
} = {}) {
  const onCommit = options.onCommit ?? vi.fn<CommitInlineValue>();
  const hook = renderHook(() => {
    const [state, setState] = useState(() =>
      initialInlineActivityFieldState(options.value ?? "Lunch"),
    );
    const actions = useInlineActivityFieldActions({
      disabled: options.disabled ?? false,
      onCommit,
      setState,
      state,
    });

    return {
      ...actions,
      setState,
      state,
    };
  });

  return { ...hook, onCommit };
}

describe("useInlineActivityFieldActions", () => {
  it("commits trimmed draft values as the new source", async () => {
    const { result, onCommit } = createHook();

    await act(async () => {
      await result.current.commit("  Dinner  ");
    });

    expect(onCommit).toHaveBeenCalledWith("Dinner");
    expect(result.current.state).toEqual({
      draft: "Dinner",
      source: "Dinner",
    });
  });

  it("resets unchanged trimmed drafts without committing", async () => {
    const { result, onCommit } = createHook();

    act(() => {
      result.current.setState((current) =>
        updateInlineActivityFieldDraft(current, " Lunch "),
      );
    });
    await act(async () => {
      await result.current.commit(result.current.state.draft);
    });

    expect(onCommit).not.toHaveBeenCalled();
    expect(result.current.state).toEqual({
      draft: "Lunch",
      source: "Lunch",
    });
  });

  it("resets drafts without committing when disabled", async () => {
    const { result, onCommit } = createHook({ disabled: true });

    act(() => {
      result.current.setState((current) =>
        updateInlineActivityFieldDraft(current, "Dinner"),
      );
    });
    await act(async () => {
      await result.current.commit(result.current.state.draft);
    });

    expect(onCommit).not.toHaveBeenCalled();
    expect(result.current.state.draft).toBe("Lunch");
  });

  it("reverts drafts on reset", () => {
    const { result } = createHook();

    act(() => {
      result.current.setState((current) =>
        updateInlineActivityFieldDraft(current, "Dinner"),
      );
      result.current.reset();
    });

    expect(result.current.state).toEqual({
      draft: "Lunch",
      source: "Lunch",
    });
  });
});
