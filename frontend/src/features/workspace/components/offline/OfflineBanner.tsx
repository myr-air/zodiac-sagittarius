"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/src/i18n/I18nProvider";
import { IconButton } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import * as styles from "./OfflineBanner.styles";

export function OfflineBanner() {
  const { t } = useI18n();
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );
  const [dismissed, setDismissed] = useState(
    typeof sessionStorage !== "undefined"
      ? sessionStorage.getItem("offline-banner-dismissed") === "true"
      : false
  );

  const handleOnline = useCallback(() => {
    setIsOffline(false);
    sessionStorage.removeItem("offline-banner-dismissed");
    setDismissed(false);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOffline(true);
    setDismissed(false);
  }, []);

  useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("offline-banner-dismissed", "true");
  };

  if (!isOffline || dismissed) return null;

  return (
    <div className={styles.bannerClassName} role="status" aria-live="polite">
      <div className={styles.bannerContentClassName}>
        <Icon name="warning" className="text-(--color-warning)" />
        <span>{t.onTripCompanion.offlineBanner}</span>
      </div>
      <IconButton aria-label={t.common.actions.close} onClick={handleDismiss}>
        <Icon name="x" />
      </IconButton>
    </div>
  );
}
