export interface ItineraryNoteModalState {
  body: string;
  saving: boolean;
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
