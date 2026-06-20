import type { RouteLiveMapState } from "./route-map.types";

export function liveMapStatusText(
  state: RouteLiveMapState,
  loadingLabel = "Loading map from OpenFreeMap",
  errorLabel = "Could not load the live map. Showing the fallback route diagram.",
): string {
  if (state === "error") return errorLabel;
  return loadingLabel;
}
