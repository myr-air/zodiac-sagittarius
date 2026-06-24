export interface StopDialogSubmitState {
  isSubmitting: boolean;
  submitError: string | null;
}

export const initialStopDialogSubmitState: StopDialogSubmitState = {
  isSubmitting: false,
  submitError: null,
};

export function clearStopDialogSubmitError(
  state: StopDialogSubmitState,
): StopDialogSubmitState {
  return state.submitError ? { ...state, submitError: null } : state;
}

export function beginStopDialogSubmit(): StopDialogSubmitState {
  return {
    isSubmitting: true,
    submitError: null,
  };
}

export function failStopDialogSubmit(
  submitError: string,
): StopDialogSubmitState {
  return {
    isSubmitting: false,
    submitError,
  };
}

export function completeStopDialogSubmit(): StopDialogSubmitState {
  return initialStopDialogSubmitState;
}
