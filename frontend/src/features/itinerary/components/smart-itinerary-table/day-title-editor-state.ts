export interface DayTitleEditorState {
  draft: string;
  saving: boolean;
  sourceTitle: string;
}

export function initialDayTitleEditorState(
  title: string,
  maxLength: number,
): DayTitleEditorState {
  const sourceTitle = title.slice(0, maxLength);

  return {
    draft: sourceTitle,
    saving: false,
    sourceTitle,
  };
}

export function updateDayTitleEditorDraft(
  state: DayTitleEditorState,
  draft: string,
): DayTitleEditorState {
  return {
    ...state,
    draft,
  };
}

export function revertDayTitleEditorDraft(
  state: DayTitleEditorState,
): DayTitleEditorState {
  return {
    ...state,
    draft: state.sourceTitle,
  };
}

export function beginDayTitleEditorSave(
  state: DayTitleEditorState,
): DayTitleEditorState {
  return {
    ...state,
    saving: true,
  };
}

export function endDayTitleEditorSave(
  state: DayTitleEditorState,
): DayTitleEditorState {
  return {
    ...state,
    saving: false,
  };
}

export function completeDayTitleEditorSave(
  state: DayTitleEditorState,
  sourceTitle: string,
): DayTitleEditorState {
  return {
    draft: sourceTitle,
    saving: false,
    sourceTitle,
  };
}
