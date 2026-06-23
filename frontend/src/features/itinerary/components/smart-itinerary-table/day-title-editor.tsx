import { useState } from "react";
import {
  dayTitleInputClassName,
  dayTitleMaxLength,
  dayTitleMinWidthCh,
} from "./smart-itinerary-table.styles";
import type { ItineraryAsyncVoidResult } from "./itinerary-action.types";
import {
  initialDayTitleEditorState,
  updateDayTitleEditorDraft,
} from "./day-title-editor-state";
import { useDayTitleEditorActions } from "./use-day-title-editor-actions";

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
  const actions = useDayTitleEditorActions({
    canEdit,
    date,
    defaultTitle,
    onSaveDayTitle,
    setState,
    state,
    version,
  });
  const dynamicWidthCh = Math.max(
    dayTitleMinWidthCh,
    Math.min(dayTitleMaxLength, state.draft.length || defaultTitle.length) + 1,
  );

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
      onBlur={() => void actions.commit(state.draft)}
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
          actions.revertWithoutCommit();
          event.currentTarget.blur();
        }
      }}
    />
  );
}
