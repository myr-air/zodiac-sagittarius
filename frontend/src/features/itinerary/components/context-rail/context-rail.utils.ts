export const contextRailTabValues = ["notes", "booking", "suggestions"] as const;
export type ContextRailTab = (typeof contextRailTabValues)[number];
