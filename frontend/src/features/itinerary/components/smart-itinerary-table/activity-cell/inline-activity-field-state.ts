export interface InlineActivityFieldState {
  draft: string;
  source: string;
}

export function initialInlineActivityFieldState(
  value: string,
): InlineActivityFieldState {
  return {
    draft: value,
    source: value,
  };
}

export function updateInlineActivityFieldDraft(
  state: InlineActivityFieldState,
  draft: string,
): InlineActivityFieldState {
  return {
    ...state,
    draft,
  };
}

export function resetInlineActivityFieldDraft(
  state: InlineActivityFieldState,
): InlineActivityFieldState {
  return {
    ...state,
    draft: state.source,
  };
}

export function commitInlineActivityFieldDraft(
  value: string,
): InlineActivityFieldState {
  return {
    draft: value,
    source: value,
  };
}
