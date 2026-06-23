import {
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { ItineraryAsyncVoidResult } from "./itinerary-action.types";
import {
  beginDayTitleEditorSave,
  completeDayTitleEditorSave,
  endDayTitleEditorSave,
  revertDayTitleEditorDraft,
  type DayTitleEditorState,
} from "./day-title-editor-state";

interface UseDayTitleEditorActionsOptions {
  canEdit: boolean;
  date: string;
  defaultTitle: string;
  onSaveDayTitle?: (
    date: string,
    version: number,
    title: string | null,
  ) => ItineraryAsyncVoidResult;
  setState: Dispatch<SetStateAction<DayTitleEditorState>>;
  state: DayTitleEditorState;
  version: number;
}

export function useDayTitleEditorActions({
  canEdit,
  date,
  defaultTitle,
  onSaveDayTitle,
  setState,
  state,
  version,
}: UseDayTitleEditorActionsOptions) {
  const suppressNextCommitRef = useRef(false);

  async function commit(nextValue: string) {
    if (!canEdit || !onSaveDayTitle || state.saving) return;
    if (suppressNextCommitRef.current) {
      suppressNextCommitRef.current = false;
      return;
    }
    const trimmed = nextValue.trim();
    const normalizedTitle = trimmed || defaultTitle;
    if (normalizedTitle === state.sourceTitle) {
      setState((current) => revertDayTitleEditorDraft(current));
      return;
    }
    setState((current) => beginDayTitleEditorSave(current));
    try {
      await onSaveDayTitle(date, version, trimmed ? normalizedTitle : null);
      setState((current) =>
        completeDayTitleEditorSave(current, normalizedTitle),
      );
    } finally {
      setState((current) => endDayTitleEditorSave(current));
    }
  }

  function revertWithoutCommit() {
    suppressNextCommitRef.current = true;
    setState((current) => revertDayTitleEditorDraft(current));
  }

  return {
    commit,
    revertWithoutCommit,
  };
}
