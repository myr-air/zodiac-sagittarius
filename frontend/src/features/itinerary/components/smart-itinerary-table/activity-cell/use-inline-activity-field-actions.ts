import type { Dispatch, SetStateAction } from "react";
import type { ItineraryAsyncVoidResult } from "../itinerary-action.types";
import {
  commitInlineActivityFieldDraft,
  resetInlineActivityFieldDraft,
  type InlineActivityFieldState,
} from "./inline-activity-field-state";

interface UseInlineActivityFieldActionsOptions {
  disabled: boolean;
  onCommit: (value: string) => ItineraryAsyncVoidResult;
  setState: Dispatch<SetStateAction<InlineActivityFieldState>>;
  state: InlineActivityFieldState;
}

export function useInlineActivityFieldActions({
  disabled,
  onCommit,
  setState,
  state,
}: UseInlineActivityFieldActionsOptions) {
  function reset() {
    setState((current) => resetInlineActivityFieldDraft(current));
  }

  async function commit(nextValue: string) {
    const trimmed = nextValue.trim();
    if (disabled || trimmed === state.source) {
      setState((current) => resetInlineActivityFieldDraft(current));
      return;
    }
    await onCommit(trimmed);
    setState(commitInlineActivityFieldDraft(trimmed));
  }

  return {
    commit,
    reset,
  };
}
