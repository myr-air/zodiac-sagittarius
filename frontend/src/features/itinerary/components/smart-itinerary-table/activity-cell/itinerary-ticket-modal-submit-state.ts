export interface ItineraryTicketModalSubmitState {
  saving: boolean;
  unlinking: boolean;
}

export const initialItineraryTicketModalSubmitState: ItineraryTicketModalSubmitState =
  {
    saving: false,
    unlinking: false,
  };

export function isItineraryTicketModalSubmitting(
  state: ItineraryTicketModalSubmitState,
): boolean {
  return state.saving || state.unlinking;
}

export function beginItineraryTicketModalSave(): ItineraryTicketModalSubmitState {
  return {
    saving: true,
    unlinking: false,
  };
}

export function beginItineraryTicketModalUnlink(): ItineraryTicketModalSubmitState {
  return {
    saving: false,
    unlinking: true,
  };
}

export function completeItineraryTicketModalSubmit(): ItineraryTicketModalSubmitState {
  return initialItineraryTicketModalSubmitState;
}
