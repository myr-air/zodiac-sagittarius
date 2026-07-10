import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import type { Phase } from "./phase";
import { derivePhase, type DerivePhaseInput } from "./derive-phase";

export interface UseDerivePhaseResult {
  /** The current phase — data-derived default, possibly overridden by user. */
  currentPhase: Phase;
  /** All phases that can be surfaced based on current trip data. */
  availablePhases: Set<Phase>;
  /** Manually switch to a different phase. No-op if the phase is not available. */
  setPhase: (phase: Phase) => void;
}

/**
 * React hook: derives the default journey phase from trip data and allows
 * user overrides. Re-derives when trip data changes. Manual phase switching
 * persists until trip data changes (re-derive on data change).
 *
 * The user override is cleared when the input reference changes, causing
 * a re-derive to the data-driven default phase.
 */
export function useDerivePhase(input: DerivePhaseInput): UseDerivePhaseResult {
  const derived = useMemo(() => derivePhase(input), [input]);

  const [userPhase, setUserPhase] = useState<Phase | null>(null);
  const initialRenderRef = useRef(true);

  // Clear user override when input changes (trip data changed).
  // Skip the initial render to avoid clearing before any user interaction.
  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }
    setUserPhase(null);
  }, [input]);

  const currentPhase = useMemo(() => {
    if (userPhase && derived.availablePhases.has(userPhase)) {
      return userPhase;
    }
    return derived.defaultPhase;
  }, [derived, userPhase]);

  const setPhase = useCallback(
    (phase: Phase) => {
      if (derived.availablePhases.has(phase)) {
        setUserPhase(phase);
      }
    },
    [derived.availablePhases],
  );

  return {
    currentPhase,
    availablePhases: derived.availablePhases,
    setPhase,
  };
}
