export interface ItineraryNoteModalState {
  body: string;
  saving: boolean;
}

export interface ItineraryNoteModalSubmission {
  body: string;
}

export const initialItineraryNoteModalState: ItineraryNoteModalState = {
  body: "",
  saving: false,
};

export function updateItineraryNoteModalBody(
  state: ItineraryNoteModalState,
  body: string,
): ItineraryNoteModalState {
  return {
    ...state,
    body,
  };
}

export function setItineraryNoteModalSaving(
  state: ItineraryNoteModalState,
  saving: boolean,
): ItineraryNoteModalState {
  return {
    ...state,
    saving,
  };
}

export function buildItineraryNoteModalSubmission(
  state: ItineraryNoteModalState,
): ItineraryNoteModalSubmission | null {
  const body = state.body.trim();
  return body && !state.saving ? { body } : null;
}
