import type { RouteLiveMapState } from "./route-map.types";

export interface RouteLiveMapLifecycleState {
  retryKey: number;
  state: RouteLiveMapState;
}

export const initialRouteLiveMapLifecycleState: RouteLiveMapLifecycleState = {
  retryKey: 0,
  state: "idle",
};

export function setRouteLiveMapState(
  lifecycle: RouteLiveMapLifecycleState,
  state: RouteLiveMapState,
): RouteLiveMapLifecycleState {
  return {
    ...lifecycle,
    state,
  };
}

export function retryRouteLiveMap(
  lifecycle: RouteLiveMapLifecycleState,
): RouteLiveMapLifecycleState {
  return {
    retryKey: lifecycle.retryKey + 1,
    state: "idle",
  };
}
