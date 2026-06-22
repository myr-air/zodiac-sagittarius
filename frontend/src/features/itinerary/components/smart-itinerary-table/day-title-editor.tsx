import { useRef, useState } from "react";
import {
  dayTitleInputClassName,
  dayTitleMaxLength,
  dayTitleMinWidthCh,
} from "./smart-itinerary-table.styles";
import type { ItineraryAsyncVoidResult } from "./itinerary-action.types";
import {
  beginDayTitleEditorSave,
  completeDayTitleEditorSave,
  endDayTitleEditorSave,
  initialDayTitleEditorState,
  revertDayTitleEditorDraft,
  updateDayTitleEditorDraft,
} from "./day-title-editor-state";

interface DayTitleEditorProps {
  canEdit: boolean;
  date: string;
  dayLabel: string;
  defaultTitle: string;
  onSaveDayTitle?: (
    date: string,
    version: number,
    title: string | null,
  ) => ItineraryAsyncVoidResult;
  title: string;
  version: number;
}

export function DayTitleEditor({
  canEdit,
  date,
  dayLabel,
  defaultTitle,
  onSaveDayTitle,
  title,
  version,
}: DayTitleEditorProps) {
  const [state, setState] = useState(() =>
    initialDayTitleEditorState(title, dayTitleMaxLength),
  );
  const suppressNextCommitRef = useRef(false);
  const dynamicWidthCh = Math.max(
    dayTitleMinWidthCh,
    Math.min(dayTitleMaxLength, state.draft.length || defaultTitle.length) + 1,
  );

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

  return (
    <input
      aria-label={`Trip day title for ${dayLabel}`}
      data-day-label={dayLabel}
      className={dayTitleInputClassName}
      disabled={!canEdit || state.saving}
      maxLength={dayTitleMaxLength}
      style={{ width: `${dynamicWidthCh}ch` }}
      title={`${state.draft.length}/${dayTitleMaxLength}`}
      value={state.draft}
      onBlur={() => void commit(state.draft)}
      onChange={(event) =>
        setState((current) =>
          updateDayTitleEditorDraft(current, event.target.value),
        )
      }
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
        if (event.key === "Escape") {
          suppressNextCommitRef.current = true;
          setState((current) => revertDayTitleEditorDraft(current));
          event.currentTarget.blur();
        }
      }}
    />
  );
}
