import { useEffect, useRef, useState } from "react";
import type { BudgetProgressBarProps } from "./BudgetProgressBar.types";
import { barContainerClass, barLabelClass } from "./BudgetProgressBar.styles";

function getColor(ratio: number): string {
  if (ratio <= 0.8) return "bg-(--color-primary)";
  if (ratio <= 1.0) return "bg-(--color-warning)";
  return "bg-(--color-danger)";
}

export function BudgetProgressBar({ spent, max, label, heightClass = "h-3" }: BudgetProgressBarProps) {
  const safeMax = max <= 0 ? 1 : max;
  const clampedSpent = Math.max(0, spent);
  const displayRatio = Math.max(0, Math.min(clampedSpent / safeMax, 1.5)); // Allow visual overflow up to 150%

  const [reducedMotion, setReducedMotion] = useState(false);
  const mqlRef = useRef<MediaQueryList | null>(null);

  useEffect(() => {
    mqlRef.current = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mqlRef.current.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mqlRef.current.addEventListener("change", handler);
    return () => mqlRef.current?.removeEventListener("change", handler);
  }, []);

  const transitionClass = reducedMotion ? "" : "transition-[width] duration-200 ease-out";
  const colorClass = getColor(displayRatio);
  const fillWidth = `${displayRatio * 100}%`;

  const displayLabel = label ?? `฿${clampedSpent.toLocaleString()} / ฿${safeMax.toLocaleString()}`;

  return (
    <div>
      <div className={`${barContainerClass} ${heightClass}`}>
        <div
          data-testid="progress-fill"
          className={`${heightClass} rounded-full ${colorClass} ${transitionClass}`}
          style={{ width: fillWidth }}
        />
      </div>
      <div className={barLabelClass} data-testid="progress-label">
        {displayLabel}
      </div>
    </div>
  );
}
