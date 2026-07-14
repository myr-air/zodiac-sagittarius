"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/src/i18n/I18nProvider";
import { IconButton } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import * as styles from "./OfflineBanner.styles";

export function OfflineBanner() {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(true);
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
    <div
      className={`${styles.bannerClassName} group max-[767px]:data-[collapsed=true]:py-1`}
      data-collapsed={collapsed ? "true" : "false"}
      role="alert"
      aria-live="polite"
    >
      <div className={styles.bannerContentClassName}>
        <Icon name="warning" className="text-(--color-warning) shrink-0" />
        <span className="max-[767px]:group-data-[collapsed=true]:hidden">{t.onTripCompanion.offlineBanner}</span>
      </div>
      <div className="hidden max-[767px]:group-data-[collapsed=true]:flex min-w-0 flex-1 items-center gap-1.5">
        <span className="min-w-0 truncate text-[13px] font-bold text-(--color-text) break-words">
          {t.onTripCompanion.offlineBanner}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="hidden max-[767px]:group-data-[collapsed=true]:inline-flex size-8 shrink-0 items-center justify-center rounded-full text-(--color-text-muted) transition-colors hover:bg-(--color-surface-subtle) hover:text-(--color-text)"
          onClick={() => setCollapsed(false)}
          aria-label="แสดงรายละเอียด"
        >
          <Icon name="chevronDown" className="size-3.5" />
        </button>
        <button
          type="button"
          className="hidden max-[767px]:group-data-[collapsed=false]:inline-flex size-8 shrink-0 items-center justify-center rounded-full text-(--color-text-muted) transition-colors hover:bg-(--color-surface-subtle) hover:text-(--color-text)"
          onClick={() => setCollapsed(true)}
          aria-label="ซ่อนรายละเอียด"
        >
          <Icon name="chevronDown" className="size-3.5 rotate-180" />
        </button>
        <div className="max-[767px]:group-data-[collapsed=true]:hidden">
          <IconButton aria-label={t.common.actions.close} onClick={handleDismiss}>
            <Icon name="x" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
