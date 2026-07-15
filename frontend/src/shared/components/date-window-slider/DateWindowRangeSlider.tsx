import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { DateWindowRangeSliderProps } from "./DateWindowRangeSlider.types";
import { usePrefersReducedMotion } from "@/src/shared/hooks/use-prefers-reduced-motion";

/** Month names for formatting. */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Format a YYYY-MM-DD date to "MMM YYYY" (e.g., "Mar 2026"). */
function formatMonthYear(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** Add `amount` months to a YYYY-MM-DD string. Returns the first day of the resulting month. */
function addMonths(dateStr: string, amount: number): string {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setMonth(date.getMonth() + amount);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

/** Clamp a date string between minDate and maxDate (inclusive). */
function clampDate(dateStr: string, minDate: string, maxDate: string): string {
  if (dateStr < minDate) return minDate;
  if (dateStr > maxDate) return maxDate;
  return dateStr;
}

/** Compute the proportion (0–1) of a date within [minDate, maxDate]. */
function dateToProportion(dateStr: string, minDate: string, maxDate: string): number {
  const ms = new Date(dateStr).getTime();
  const min = new Date(minDate).getTime();
  const max = new Date(maxDate).getTime();
  const range = max - min;
  if (range <= 0) return 0.5;
  return (ms - min) / range;
}

type ActiveHandle = "start" | "end" | null;

export function DateWindowRangeSlider({
  minDate,
  maxDate,
  start,
  end,
  onChange,
  ariaLabelStart,
  ariaLabelEnd,
}: DateWindowRangeSliderProps) {
  const startId = useId();
  const endId = useId();
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeHandle, setActiveHandle] = useState<ActiveHandle>(null);

  const startPct = dateToProportion(start, minDate, maxDate);
  const endPct = dateToProportion(end, minDate, maxDate);

  const leftPct = Math.min(startPct, endPct) * 100;
  const widthPct = Math.abs(endPct - startPct) * 100;

  const reducedMotion = usePrefersReducedMotion();

  /** Derive a date from a pixel position in the track. */
  const positionToDate = useCallback(
    (clientX: number): string => {
      const track = trackRef.current;
      if (!track) return start;
      const rect = track.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const minMs = new Date(minDate).getTime();
      const maxMs = new Date(maxDate).getTime();
      const dateMs = minMs + fraction * (maxMs - minMs);
      const d = new Date(dateMs);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      return `${y}-${m}-01`;
    },
    [minDate, maxDate, start],
  );

  /** Keyboard handler. */
  const handleKeyDown = useCallback(
    (which: "start" | "end", e: React.KeyboardEvent) => {
      const current = which === "start" ? start : end;
      let newDate = current;
      const step = e.shiftKey ? 6 : 1;

      switch (e.key) {
        case "ArrowRight":
          newDate = addMonths(current, step);
          break;
        case "ArrowLeft":
          newDate = addMonths(current, -step);
          break;
        case "Home":
          newDate = minDate;
          break;
        case "End":
          newDate = maxDate;
          break;
        default:
          return; // Not a handled key
      }

      e.preventDefault();

      // Clamp to [minDate, maxDate]
      newDate = clampDate(newDate, minDate, maxDate);

      if (which === "start") {
        if (newDate > end) newDate = end;
        if (newDate !== start) onChange(newDate, end);
      } else {
        if (newDate < start) newDate = start;
        if (newDate !== end) onChange(start, newDate);
      }
    },
    [start, end, minDate, maxDate, onChange],
  );

  /** Mouse/touch down on a handle. */
  const handlePointerDown = useCallback((which: ActiveHandle) => {
    setActiveHandle(which);
  }, []);

  /** Mouse/touch move on the document (while dragging). */
  useEffect(() => {
    if (!activeHandle) return;

    const onMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0]?.clientX : e.clientX;
      if (clientX === undefined) return;
      const newDate = positionToDate(clientX);

      if (activeHandle === "start") {
        const clamped = newDate > end ? end : newDate;
        if (clamped !== start) onChange(clamped, end);
      } else {
        const clamped = newDate < start ? start : newDate;
        if (clamped !== end) onChange(start, clamped);
      }
    };

    const onEnd = () => setActiveHandle(null);

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend", onEnd);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onEnd);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    };
  }, [activeHandle, start, end, minDate, maxDate, positionToDate, onChange]);

  const motionClass = reducedMotion ? "" : "transition-[left] duration-200 ease-out";

  return (
    <div ref={trackRef} role="presentation" className="relative w-full h-[56px]">
      {/* Track background */}
      <div className="absolute top-1/2 -translate-y-1/2 w-full h-1.5 bg-(--color-border) rounded-full" />

      {/* Range fill between handles */}
      <div
        data-testid="range-fill"
        className={`absolute top-1/2 -translate-y-1/2 h-3 bg-(--color-primary-soft) rounded-full ${motionClass}`}
        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
      />

      {/* Start handle */}
      <div
        id={startId}
        role="slider"
        tabIndex={0}
        aria-valuenow={startPct}
        aria-valuemin={0}
        aria-valuemax={1}
        aria-label={ariaLabelStart ?? "Start date"}
        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-(--color-primary) cursor-pointer"
        style={{ left: `${startPct * 100}%` }}
        onMouseDown={() => handlePointerDown("start")}
        onTouchStart={() => handlePointerDown("start")}
        onKeyDown={(e) => handleKeyDown("start", e)}
      >
        <span
          data-testid="handle-label"
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs tabular-nums text-(--color-text-muted)"
        >
          {formatMonthYear(start)}
        </span>
      </div>

      {/* End handle */}
      <div
        id={endId}
        role="slider"
        tabIndex={0}
        aria-valuenow={endPct}
        aria-valuemin={0}
        aria-valuemax={1}
        aria-label={ariaLabelEnd ?? "End date"}
        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-(--color-primary) cursor-pointer"
        style={{ left: `${endPct * 100}%` }}
        onMouseDown={() => handlePointerDown("end")}
        onTouchStart={() => handlePointerDown("end")}
        onKeyDown={(e) => handleKeyDown("end", e)}
      >
        <span
          data-testid="handle-label"
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs tabular-nums text-(--color-text-muted)"
        >
          {formatMonthYear(end)}
        </span>
      </div>
    </div>
  );
}
