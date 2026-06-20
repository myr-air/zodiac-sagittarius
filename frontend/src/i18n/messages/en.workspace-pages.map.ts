export const enMapMessages = {
  pageLabel: "Route map",
  title: "Map",
  filterLabel: "Choose map day",
  allDays: "All days",
  chooseDay: "Choose day",
  canvasLabel: "Map preview of the Hong Kong and Shenzhen itinerary route",
  liveLoading: "Loading map from OpenFreeMap",
  liveError: "Could not load the live map. Showing the fallback route diagram.",
  retryLiveMap: "Retry live map",
  resolveMissing: ({ count }: { count: number }) => `Find coordinates for ${count}`,
  resolvingMissing: ({ count }: { count: number }) => `Finding ${count} coordinates...`,
  resolveBatchHint: ({ count, total }: { count: number; total: number }) => `Runs ${count} at a time to keep map lookup fast. ${total} still need coordinates.`,
  resolveProgress: ({ count, total }: { count: number; total: number }) => `Looking up ${count} of ${total} unresolved activities.`,
  resolveResult: ({ attempted, failed, resolved, skipped }: { attempted: number; failed: number; resolved: number; skipped: number }) =>
    resolved === 0
      ? `Found 0/${attempted}. Try a day filter or use more specific place names.`
      : `Found ${resolved}/${attempted}. ${skipped + failed} need review.`,
  resolveUnavailable: "Place resolver is not available",
  visibleStopsLabel: "Visible route stops",
  locationStatus: ({ mapped, total, unresolved }: { mapped: number; total: number; unresolved: number }) => `${mapped}/${total} mapped · ${unresolved} unresolved`,
  unresolvedLabel: "Activities without coordinates",
  unresolvedTitle: ({ count }: { count: number }) => `${count} activities need coordinates`,
  sourceNote: "Live tiles: OpenFreeMap + OpenStreetMap data · Renderer: MapLibre GL JS",
} as const;
