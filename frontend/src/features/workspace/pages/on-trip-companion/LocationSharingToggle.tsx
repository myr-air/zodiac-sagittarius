"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/src/i18n/I18nProvider";
import { Icon } from "@/src/ui/icons";
import { cn } from "@/src/lib/cn";

export interface LocationSharingToggleProps {
  isTripActive: boolean;
  tripEndDate: string;
  onToggle: (enabled: boolean) => void;
  enabled: boolean;
}

export function LocationSharingToggle({
  isTripActive,
  tripEndDate,
  onToggle,
  enabled,
}: LocationSharingToggleProps) {
  const { t } = useI18n();
  const otc = t.onTripCompanion;
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);

  useEffect(() => {
    async function checkPermission() {
      if (typeof navigator === "undefined" || !navigator.permissions) {
        return;
      }
      try {
        const result = await navigator.permissions.query({ name: "geolocation" });
        setPermissionState(result.state);
      } catch {
        // Ignore unsupported permission queries.
      }
    }

    checkPermission();

    function handleFocus() {
      checkPermission();
    }

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const handleToggle = async () => {
    const nextEnabled = !enabled;

    if (!nextEnabled) {
      onToggle(false);
      return;
    }

    if (!isTripActive) {
      return;
    }

    if (typeof navigator !== "undefined" && navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: "geolocation" });
        setPermissionState(result.state);

        if (result.state === "denied") {
          onToggle(true);
          return;
        }
      } catch {
        // Ignore unsupported permission queries.
      }
    }

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {},
        () => {},
      );
    }

    onToggle(true);
  };

  const showDenied = permissionState === "denied" && enabled && isTripActive;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-(--radius-md) bg-(--color-surface) border border-(--color-border)",
        !isTripActive && "opacity-75",
      )}
    >
      <Icon name="location" className="text-(--color-text-muted)" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-(--color-text)">{otc.locationSharingToggle}</div>
        {showDenied && (
          <div className="text-xs text-(--color-text-muted) mt-0.5">
            {otc.locationSharingOff}{" "}
            <button
              type="button"
              className="underline hover:text-(--color-text)"
              onClick={() => {
                window.open("#location-settings", "_self");
              }}
            >
              {otc.locationSharingOpenSettings}
            </button>
          </div>
        )}
        {!isTripActive && (
          <div className="text-xs text-(--color-text-muted) mt-0.5" data-testid="trip-ended-message">
            {otc.locationSharingTripEnded}
          </div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={otc.locationSharingToggle}
        disabled={!isTripActive}
        onClick={handleToggle}
        data-testid="location-sharing-switch"
        className={cn(
          "relative inline-flex h-11 w-16 shrink-0 items-center rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary)",
          enabled ? "bg-(--color-primary)" : "bg-(--color-border-strong)",
          !isTripActive && "cursor-not-allowed opacity-50",
        )}
      >
        <span
          className={cn(
            "inline-block h-7 w-7 rounded-full bg-white shadow-sm transition-transform duration-150",
            enabled ? "translate-x-8" : "translate-x-1",
          )}
        />
      </button>
    </div>
  );
}
