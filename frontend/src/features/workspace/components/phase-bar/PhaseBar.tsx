"use client";

import { useCallback, useRef, type KeyboardEvent } from "react";
import { cn } from "../../../../lib/cn";
import { Icon } from "../../../../ui/icons";
import { useI18n } from "../../../../i18n/I18nProvider";
import { PHASE_ICONS, PHASE_LABELS, PHASE_ORDER, type Phase } from "../../../../trip/workspace/phase";
import type { PhaseBarProps } from "./PhaseBar.types";
import {
  phaseBarRootClassName,
  phaseBarTabBase,
  phaseBarTabActive,
  phaseBarTabAvailable,
  phaseBarTabUnavailable,
  phaseBarIconClassName,
  phaseBarLabelClassName,
} from "./PhaseBar.styles";

/**
 * Horizontal tab bar showing the 6 journey phases.
 * Desktop (≥1280px): icon + label via xl:inline.
 * Tablet/mobile: icon-only with aria-label for accessibility.
 *
 * Uses ARIA tab semantics: role="tab", aria-selected, arrow key navigation.
 */
export function PhaseBar({
  phases,
  currentPhase,
  onPhaseChange,
  unavailablePhases,
  className,
}: PhaseBarProps) {
  const { t } = useI18n();
  const tabRefs = useRef<Map<Phase, HTMLButtonElement>>(new Map());

  const orderedPhases = phases.length > 0 ? phases : PHASE_ORDER;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
      let nextIndex = currentIndex;
      if (e.key === "ArrowRight") {
        nextIndex = (currentIndex + 1) % orderedPhases.length;
      } else if (e.key === "ArrowLeft") {
        nextIndex = (currentIndex - 1 + orderedPhases.length) % orderedPhases.length;
      } else {
        return;
      }
      e.preventDefault();
      const nextPhase = orderedPhases[nextIndex];
      tabRefs.current.get(nextPhase)?.focus();
    },
    [orderedPhases],
  );

  return (
    <div className={cn(phaseBarRootClassName, className)} role="tablist" aria-label="Journey phases">
      {orderedPhases.map((phase, index) => {
        const isActive = phase === currentPhase;
        const isUnavailable = unavailablePhases?.has(phase) ?? false;
        const iconName = PHASE_ICONS[phase];
        const labelKey = PHASE_LABELS[phase];
        const label = getNestedI18n(t, labelKey);

        const stateClasses = isActive
          ? phaseBarTabActive
          : isUnavailable
            ? phaseBarTabUnavailable
            : phaseBarTabAvailable;

        return (
          <button
            key={phase}
            ref={(el) => {
              if (el) tabRefs.current.set(phase, el);
              else tabRefs.current.delete(phase);
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-disabled={isUnavailable ? true : undefined}
            tabIndex={isActive ? 0 : -1}
            className={cn(phaseBarTabBase, stateClasses)}
            onClick={() => {
              if (!isUnavailable) onPhaseChange(phase);
            }}
            onKeyDown={(e) => handleKeyDown(e, index)}
            title={isUnavailable ? `Need data to unlock: ${label}` : label}
          >
            <Icon name={iconName} className={cn(phaseBarIconClassName)} />
            <span className={cn(phaseBarLabelClassName)}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Resolves a dotted i18n key path (e.g. "phases.dreamer") from the t messages object.
 */
function getNestedI18n(t: ReturnType<typeof useI18n>["t"], keyPath: string): string {
  const parts = keyPath.split(".");
  let value: unknown = t;
  for (const part of parts) {
    if (value == null || typeof value !== "object") return keyPath;
    value = (value as Record<string, unknown>)[part];
  }
  return typeof value === "string" ? value : keyPath;
}
