"use client";

import { useEffect, useState } from "react";
import type { ApiVersionInfo, WebVersionInfo } from "@/src/app-version";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { Icon } from "@/src/ui/icons";
import {
  type AboutDetailRowModel,
  type AboutVersionPanelModel,
  type ApiVersionState,
  buildAboutDetailRows,
  buildAboutStatusModel,
  buildAboutVersionPanels,
} from "./AboutAppPage.model";
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

export function AboutAppPage({ webVersion }: AboutAppPageProps) {
  const { t } = useI18n();
  const [apiVersion, setApiVersion] = useState<ApiVersionState>({ status: "loading" });

  useEffect(() => {
    if (webVersion.runtimeMode === "local") {
      setApiVersion({ status: "unavailable" });
      return;
    }

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

  const status = buildAboutStatusModel(apiVersion, t.aboutApp);
  const statusClassName = status.tone === "ready" ? statusPillReadyClassName : status.tone === "loading" ? statusPillLoadingClassName : statusPillUnavailableClassName;
  const versionPanels = buildAboutVersionPanels({
    apiVersion,
    labels: t.aboutApp,
    webVersion,
  });
  const detailRows = buildAboutDetailRows({
    apiVersion,
    labels: t.aboutApp,
    webVersion,
  });

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
              <Icon name={status.icon} />
              {status.label}
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
            {versionPanels.map((panel) => (
              <VersionPanel key={panel.label} {...panel} />
            ))}
          </div>
        </section>

        <section className={sectionClassName} aria-labelledby="details-heading">
          <h2 className={sectionTitleClassName} id="details-heading">{t.aboutApp.detailsTitle}</h2>
          <div className={detailGridClassName}>
            {detailRows.map((row) => (
              <DetailRow key={row.label} {...row} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function VersionPanel({ details, icon, label, muted = false, value }: AboutVersionPanelModel) {
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

function DetailRow({ label, value }: AboutDetailRowModel) {
  return (
    <div className={detailRowClassName}>
      <span className={labelClassName}>{label}</span>
      <span className={detailValueClassName}>{value}</span>
    </div>
  );
}
