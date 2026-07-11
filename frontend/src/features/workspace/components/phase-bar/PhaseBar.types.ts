import type { Phase } from "@/src/trip/workspace/phase";

export interface PhaseBarProps {
  /** All 6 phases in order. Some may be unavailable (no data yet). */
  phases: Phase[];
  /** The currently active phase (auto-derived or user-selected). */
  currentPhase: Phase;
  /** Called when the user clicks a phase tab. */
  onPhaseChange: (phase: Phase) => void;
  /** Optional set of phases that are unavailable (no prerequisite data). */
  unavailablePhases?: Set<Phase>;
  /** Optional additional class name for the root element. */
  className?: string;
}
