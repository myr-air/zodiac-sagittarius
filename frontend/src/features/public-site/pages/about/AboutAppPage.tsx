"use client";

import { useEffect, useState } from "react";
import type { ApiVersionInfo, WebVersionInfo } from "@/src/app-version";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { Icon } from "@/src/ui/icons";
import {
  detailGridClassName,
  detailRowClassName,
  detailValueClassName,
  eyebrowClassName,
  heroClassName,
  heroCopyClassName,
  heroRouteClassName,
  heroStatusCardClassName,
  heroVisualClassName,
  labelClassName,
  mutedValueClassName,
  pageClassName,
  panelClassName,
  panelHeaderClassName,
  panelTitleRowClassName,
  sectionClassName,
  sectionTitleClassName,
  shellClassName,
  statusPillClassName,
  statusPillLoadingClassName,
  statusPillReadyClassName,
  statusPillUnavailableClassName,
  subtitleClassName,
  titleClassName,
  valueClassName,
  versionGridClassName,
} from "./AboutAppPage.styles";

interface AboutAppPageProps {
  webVersion: WebVersionInfo;
}

type ApiVersionState =
  | { status: "loading" }
  | { status: "ready"; value: ApiVersionInfo }
  | { status: "unavailable" };

export function AboutAppPage({ webVersion }: AboutAppPageProps) {
  const { t } = useI18n();
  const [apiVersion, setApiVersion] = useState<ApiVersionState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function loadApiVersion() {
      try {
        const response = await fetch(webVersion.apiVersionUrl, { cache: "no-store" });
        if (!response.ok) throw new Error("API version unavailable");
        const value = await response.json() as ApiVersionInfo;
        if (!cancelled) setApiVersion({ status: "ready", value });
      } catch {
        if (!cancelled) setApiVersion({ status: "unavailable" });
      }
    }

    void loadApiVersion();

    return () => {
      cancelled = true;
    };
  }, [webVersion.apiVersionUrl]);

  const apiValue = apiVersion.status === "ready" ? apiVersion.value : null;
  const statusLabel = apiVersion.status === "ready" ? t.aboutApp.status.connected : apiVersion.status === "loading" ? t.aboutApp.status.checking : t.aboutApp.status.unavailable;
  const statusClassName = apiVersion.status === "ready" ? statusPillReadyClassName : apiVersion.status === "loading" ? statusPillLoadingClassName : statusPillUnavailableClassName;

  return (
    <main className={pageClassName}>
      <div className={shellClassName}>
        <header className={heroClassName}>
          <div className={heroCopyClassName}>
            <span className={eyebrowClassName}><Icon name="settings" /> {t.aboutApp.eyebrow}</span>
            <h1 className={titleClassName}>{t.aboutApp.title}</h1>
            <p className={subtitleClassName}>
              {t.aboutApp.subtitle}
            </p>
            <span className={cn(statusPillClassName, statusClassName)}>
              <Icon name={apiVersion.status === "ready" ? "check" : apiVersion.status === "loading" ? "clock" : "warning"} />
              {statusLabel}
            </span>
          </div>
          <div className={heroVisualClassName} aria-hidden="true">
            <svg className={heroRouteClassName} viewBox="0 0 320 220" focusable="false">
              <path d="M38 156 C86 82 122 72 168 118 S246 174 286 78" />
              <circle cx="38" cy="156" r="10" />
              <circle cx="168" cy="118" r="10" />
              <circle cx="286" cy="78" r="10" />
            </svg>
            <div className={heroStatusCardClassName}>
              <span className={labelClassName}>{t.aboutApp.deploymentTrack}</span>
              <strong className={detailValueClassName}>{webVersion.environment}</strong>
            </div>
          </div>
        </header>

        <section className={sectionClassName} aria-labelledby="version-heading">
          <h2 className={sectionTitleClassName} id="version-heading">{t.aboutApp.versionsTitle}</h2>
          <div className={versionGridClassName}>
            <VersionPanel
              label={t.aboutApp.webVersion}
              icon="layout"
              value={`${webVersion.service} v${webVersion.version}`}
              details={[
                [t.aboutApp.buildSha, webVersion.buildSha],
                [t.aboutApp.buildTime, webVersion.buildTime],
              ]}
            />
            <VersionPanel
              label={t.aboutApp.apiVersion}
              icon="cloud"
              value={apiValue ? `${apiValue.service} v${apiValue.version}` : apiVersion.status === "loading" ? t.aboutApp.checkingApiVersion : t.aboutApp.apiVersionUnavailable}
              muted={!apiValue}
              details={[
                [t.aboutApp.buildSha, apiValue?.buildSha ?? t.aboutApp.unavailableValue],
                [t.aboutApp.buildTime, apiValue?.buildTime ?? t.aboutApp.unavailableValue],
              ]}
            />
          </div>
        </section>

        <section className={sectionClassName} aria-labelledby="details-heading">
          <h2 className={sectionTitleClassName} id="details-heading">{t.aboutApp.detailsTitle}</h2>
          <div className={detailGridClassName}>
            <DetailRow label={t.aboutApp.environment} value={apiValue?.environment ?? webVersion.environment} />
            <DetailRow label={t.aboutApp.runtimeMode} value={webVersion.runtimeMode} />
            <DetailRow label={t.aboutApp.apiHost} value={webVersion.apiHost} />
            <DetailRow label={t.aboutApp.schemaVersion} value={apiValue?.schemaVersion ?? webVersion.schemaVersion} />
          </div>
        </section>
      </div>
    </main>
  );
}

interface VersionPanelProps {
  details: Array<[string, string]>;
  icon: "cloud" | "layout";
  label: string;
  muted?: boolean;
  value: string;
}

function VersionPanel({ details, icon, label, muted = false, value }: VersionPanelProps) {
  return (
    <article className={panelClassName}>
      <div className={panelHeaderClassName}>
        <div className={panelTitleRowClassName}>
          <span className={labelClassName}>{label}</span>
          <Icon name={icon} />
        </div>
        <strong className={cn(muted ? mutedValueClassName : valueClassName)}>{value}</strong>
      </div>
      <div className={detailGridClassName}>
        {details.map(([detailLabel, detailValue]) => (
          <DetailRow key={detailLabel} label={detailLabel} value={detailValue} />
        ))}
      </div>
    </article>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={detailRowClassName}>
      <span className={labelClassName}>{label}</span>
      <span className={detailValueClassName}>{value}</span>
    </div>
  );
}
