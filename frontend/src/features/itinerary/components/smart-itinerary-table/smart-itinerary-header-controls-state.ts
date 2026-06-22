export interface SmartItineraryHeaderControlsState {
  expanded: boolean;
  render: boolean;
}

export const initialSmartItineraryHeaderControlsState: SmartItineraryHeaderControlsState =
  {
    expanded: false,
    render: false,
  };

export function toggleSmartItineraryHeaderControls(
  state: SmartItineraryHeaderControlsState,
): SmartItineraryHeaderControlsState {
  return state.expanded
    ? {
        expanded: false,
        render: state.render,
      }
    : {
        expanded: true,
        render: true,
      };
}

export function closeSmartItineraryHeaderControls(
  state: SmartItineraryHeaderControlsState,
): SmartItineraryHeaderControlsState {
  return {
    ...state,
    expanded: false,
  };
}

export function unmountClosedSmartItineraryHeaderControls(): SmartItineraryHeaderControlsState {
  return initialSmartItineraryHeaderControlsState;
}
