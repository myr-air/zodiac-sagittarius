import type { ContextRailTab } from "@/src/features/itinerary/components";

export type WorkspaceContextRailTab = ContextRailTab;
export type WorkspaceContextRailPrimaryTab = Extract<
  WorkspaceContextRailTab,
  "notes" | "booking"
>;
