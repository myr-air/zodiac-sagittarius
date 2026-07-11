import type { IconName } from "../../ui/icons";

/**
 * A journey phase in the 6-phase travel planning arc.
 * Derived from trip data present, not stored — see derive-phase.ts.
 */
export const PHASES = [
  "dreamer",
  "flexible-hunter",
  "route-builder",
  "detail-planner",
  "group-wrangler",
  "on-trip-companion",
] as const;

export type Phase = (typeof PHASES)[number];

/** Ordered list of phases matching the user's natural planning progression. */
export const PHASE_ORDER: Phase[] = [
  "dreamer",
  "flexible-hunter",
  "route-builder",
  "detail-planner",
  "group-wrangler",
  "on-trip-companion",
];

/** i18n key path — used with t("phases.<key>") to get the current locale label. */
export const PHASE_LABELS: Record<Phase, string> = {
  dreamer: "phases.dreamer",
  "flexible-hunter": "phases.flexibleHunter",
  "route-builder": "phases.routeBuilder",
  "detail-planner": "phases.detailPlanner",
  "group-wrangler": "phases.groupWrangler",
  "on-trip-companion": "phases.onTripCompanion",
};

/** Lucide icon name for each phase tab. All icons exist in the project's IconName set. */
export const PHASE_ICONS: Record<Phase, IconName> = {
  dreamer: "sun",
  "flexible-hunter": "calendar",
  "route-builder": "route",
  "detail-planner": "table",
  "group-wrangler": "users",
  "on-trip-companion": "clock",
};
