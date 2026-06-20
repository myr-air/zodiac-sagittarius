export const mapLoadStateValues = ["idle", "loading", "ready", "error"] as const;
export type MapLoadState = (typeof mapLoadStateValues)[number];
