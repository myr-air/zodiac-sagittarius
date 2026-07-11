"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { useI18n } from "@/src/i18n/I18nProvider";

interface CompanionDesktopFallbackProps {
  tripUrl: string;
  todayActivities: Array<{ id: string; startTime: string; activity: string }>;
}

export function CompanionDesktopFallback({ tripUrl, todayActivities }: CompanionDesktopFallbackProps) {
  const { t } = useI18n();
  const otc = t.onTripCompanion;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, tripUrl, { width: 180 }).catch(() => {
        // Ignore QR rendering failures (e.g. jsdom without canvas support).
      });
    }
  }, [tripUrl]);

  const visibleActivities = todayActivities.slice(0, 5);
  const remaining = Math.max(todayActivities.length - 5, 0);

  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="max-w-md w-full mx-auto p-6 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) flex flex-col items-center gap-6">
        <div className="w-full" data-testid="today-activities-list">
          {todayActivities.length === 0 ? (
            <p className="text-sm text-(--color-text-muted)" data-testid="no-activities-message">
              {otc.noActivitiesToday}
            </p>
          ) : (
            <ul className="grid gap-2">
              {visibleActivities.map((item) => (
                <li key={item.id} className="text-sm text-(--color-text) flex gap-2" data-testid={`activity-${item.id}`}>
                  <span className="tabular-nums text-(--color-text-muted)">{item.startTime}</span>
                  <span className="truncate">{item.activity}</span>
                </li>
              ))}
              {remaining > 0 && (
                <li className="text-sm text-(--color-text-muted)" data-testid="more-activities-message">
                  {otc.moreActivities({ count: remaining })}
                </li>
              )}
            </ul>
          )}
        </div>

        <h2 className="text-lg font-bold text-(--color-text) text-center">{otc.openOnMobile}</h2>

        <canvas
          ref={canvasRef}
          aria-label={otc.openOnMobile}
          role="img"
          className="rounded-(--radius-md)"
          data-testid="companion-qr-canvas"
        />

        <p className="text-sm text-(--color-text-muted) text-center" data-testid="desktop-description">
          {otc.companionDesktopDescription}
        </p>
      </div>
    </div>
  );
}
