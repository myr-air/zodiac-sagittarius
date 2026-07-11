import type { Phase } from "./phase";

/**
 * Input to derivePhase — a minimal view of the trip sufficient to determine phase.
 * Extend this interface as the trip data model grows (waypoints, budget, etc.).
 */
export interface DerivePhaseInput {
  name: string;
  destinationLabel: string;
  startDate: string;
  endDate: string;
  /** Number of itinerary activities across all days/plans. */
  activityCount: number;
  /** Whether the trip has waypoints (Phase 3 Route Builder data). */
  hasWaypoints: boolean;
  /** Whether a flexible date window is explicitly set (vs fixed calendar dates). */
  hasDateWindow: boolean;
  /** Number of members (including owner). */
  memberCount: number;
  /** Whether any trip dates are in the past or today. */
  isTripActive: boolean;
}

export interface DerivedPhase {
  /** The data-driven default phase. Users can manually override. */
  defaultPhase: Phase;
  /** All phases that can be surfaced based on current trip data. */
  availablePhases: Set<Phase>;
}

/**
 * Derives the default journey phase and available phases from trip data.
 *
 * Priority (first match wins):
 *   1. Activities present → detail-planner
 *   2. Waypoints present → route-builder
 *   3. Date window set → flexible-hunter
 *   4. Name + destination only → dreamer
 *
 * Members presence is an overlay — unlocks group-wrangler without changing default.
 * Active trip dates unlock on-trip-companion without changing default.
 */
export function derivePhase(input: DerivePhaseInput): DerivedPhase {
  const available = new Set<Phase>(["dreamer"]);

  let defaultPhase: Phase = "dreamer";

  if (input.activityCount > 0) {
    defaultPhase = "detail-planner";
  } else if (input.hasWaypoints) {
    defaultPhase = "route-builder";
  } else if (input.hasDateWindow) {
    defaultPhase = "flexible-hunter";
  }

  // Unlock phases based on data present
  if (input.hasDateWindow || input.activityCount > 0 || input.hasWaypoints) {
    available.add("flexible-hunter");
  }
  if (input.hasWaypoints || input.activityCount > 0) {
    available.add("route-builder");
  }
  if (input.activityCount > 0) {
    available.add("detail-planner");
  }

  // Members overlay — unlocks group-wrangler regardless of default
  if (input.memberCount > 1) {
    available.add("group-wrangler");
  }

  // Active trip — unlocks on-trip-companion regardless of default
  if (input.isTripActive) {
    available.add("on-trip-companion");
  }

  // Dreamer is always available (it's the fallback surface)
  available.add(defaultPhase);

  return { defaultPhase, availablePhases: available };
}
