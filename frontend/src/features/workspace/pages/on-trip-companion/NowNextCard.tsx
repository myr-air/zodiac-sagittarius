"use client";

import { cn } from "@/src/lib/cn";
import type { NowNextState } from "@/src/trip/itinerary-core/itinerary-types";
import { nowCardClassName, nextCardClassName, countdownWarningClassName } from "./OnTripCompanionPage.styles";

export interface NowNextCardProps {
  nowNextState: NowNextState;
  countdownMinutes: number | null;
  nowLabel: string;
  nextLabel: string;
  countdownLabel: (minutes: number) => string;
  noCurrentLabel: string;
}

export function NowNextCard({
  nowNextState,
  countdownMinutes,
  nowLabel,
  nextLabel,
  countdownLabel,
  noCurrentLabel,
}: NowNextCardProps) {
  const { current, next } = nowNextState;

  return (
    <div aria-live="polite" role="status" className="flex flex-col gap-3">
      {current ? (
        <div className={nowCardClassName} data-testid="now-card">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-(--color-text-muted)">{nowLabel}</span>
            <span className="text-[20px] font-bold text-(--color-primary)" data-testid="now-time">
              {current.startTime}
            </span>
          </div>
          <h2 className="text-[18px] font-bold leading-tight text-(--color-text)" data-testid="now-activity">
            {current.activity}
          </h2>
          {typeof current.durationMinutes === "number" && current.durationMinutes > 0 && (
            <p className="text-sm text-(--color-text-muted)" data-testid="now-duration">
              {current.durationMinutes} min
            </p>
          )}
          {countdownMinutes !== null && countdownMinutes < 60 && (
            <p className={cn("text-sm font-semibold", countdownWarningClassName)} data-testid="now-countdown">
              {countdownLabel(countdownMinutes)}
            </p>
          )}
        </div>
      ) : (
        <div className={cn(nowCardClassName, "text-(--color-text-muted)")} data-testid="no-current-message">
          {noCurrentLabel}
        </div>
      )}

      {next && (
        <div className={nextCardClassName} data-testid="next-card">
          <span className="text-xs font-semibold uppercase tracking-wide text-(--color-text-muted)">{nextLabel}</span>
          <div className="flex items-baseline gap-3">
            <span className="text-[16px] font-semibold text-(--color-text)" data-testid="next-time">
              {next.startTime}
            </span>
            <span className="text-[14px] text-(--color-text-muted) truncate" data-testid="next-activity">
              {next.activity}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
