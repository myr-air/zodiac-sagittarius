"use client";

import { useEffect, useState } from "react";
import type { ApiVersionInfo, WebVersionInfo } from "@/src/app-version";
import { cn } from "@/src/lib/cn";
import { Icon } from "./icons";

interface AboutAppPageProps {
  webVersion: WebVersionInfo;
}

type ApiVersionState =
  | { status: "loading" }
  | { status: "ready"; value: ApiVersionInfo }
  | { status: "unavailable" };

const pageClassName = "about-page min-h-screen overflow-hidden bg-[var(--watercolor-page-wash),var(--color-page)] px-4 py-6 text-(--color-text) sm:px-6 lg:px-8";
const shellClassName = "mx-auto grid w-full max-w-6xl gap-5";
const heroClassName = "about-hero relative isolate grid min-h-[238px] gap-5 overflow-hidden rounded-(--radius-lg) border border-(--color-border) bg-[var(--watercolor-surface-wash),rgb(255_255_255_/_0.94)] p-5 shadow-[var(--shadow-panel)] md:grid-cols-[minmax(0,1fr)_300px] md:p-6";
const heroCopyClassName = "relative z-[1] grid content-center gap-3";
const eyebrowClassName = "inline-flex w-fit items-center gap-2 rounded-full border border-(--color-primary-border) bg-(--color-primary-soft) px-3 py-1 text-xs font-extrabold text-(--color-primary-strong) [&_.icon]:size-3.5";
const titleClassName = "m-0 text-[34px] font-black leading-[42px] text-(--color-text) [text-wrap:balance] max-[767px]:text-[28px] max-[767px]:leading-9";
const subtitleClassName = "m-0 max-w-[620px] text-sm font-semibold leading-6 text-(--color-text-muted) [text-wrap:pretty]";
const heroVisualClassName = "relative hidden min-h-[190px] overflow-hidden rounded-(--radius-lg) border border-(--color-route-border) bg-[linear-gradient(135deg,rgb(239_246_255_/_0.96),rgb(255_247_237_/_0.9))] md:block";
const heroRouteClassName = "absolute inset-0 size-full [&_circle]:fill-(--color-primary) [&_circle]:stroke-white [&_circle]:[stroke-width:4] [&_path]:fill-none [&_path]:stroke-(--color-route) [&_path]:[stroke-linecap:round] [&_path]:[stroke-width:6]";
const heroStatusCardClassName = "absolute bottom-4 left-4 right-4 grid gap-1 rounded-(--radius-md) border border-(--color-border) bg-[rgb(255_255_255_/_0.92)] px-3 py-2 shadow-[0_10px_22px_rgb(37_99_235_/_0.08)]";
const statusPillClassName = "inline-flex min-h-8 w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-extrabold [&_.icon]:size-3.5";
const statusPillReadyClassName = "border-(--color-success-border) bg-(--color-success-soft) text-[#166534]";
const statusPillLoadingClassName = "border-(--color-route-border) bg-(--color-route-soft) text-(--color-route)";
const statusPillUnavailableClassName = "border-(--color-warning-border) bg-(--color-warning-soft) text-(--color-warning-strong)";
const sectionClassName = "grid gap-3";
const sectionTitleClassName = "m-0 text-base font-extrabold leading-6 text-(--color-text)";
const versionGridClassName = "grid gap-3 md:grid-cols-2";
const panelClassName = "version-panel grid gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4 shadow-[0_10px_22px_rgb(55_47_38_/_0.04)]";
const panelHeaderClassName = "grid gap-2";
const panelTitleRowClassName = "flex min-w-0 items-center justify-between gap-3";
const labelClassName = "text-xs font-extrabold text-(--color-text-muted)";
const valueClassName = "break-words text-lg font-extrabold leading-7 text-(--color-text)";
const detailGridClassName = "grid gap-2 sm:grid-cols-2";
const detailRowClassName = "grid min-w-0 gap-1 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-3 py-2";
const detailValueClassName = "break-words text-sm font-extrabold leading-5 text-(--color-text)";
const mutedValueClassName = "text-sm font-semibold leading-5 text-(--color-text-muted)";

export function AboutAppPage({ webVersion }: AboutAppPageProps) {
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
  const statusLabel = apiVersion.status === "ready" ? "API connected" : apiVersion.status === "loading" ? "Checking API" : "API unavailable";
  const statusClassName = apiVersion.status === "ready" ? statusPillReadyClassName : apiVersion.status === "loading" ? statusPillLoadingClassName : statusPillUnavailableClassName;

  return (
    <main className={pageClassName}>
      <div className={shellClassName}>
        <header className={heroClassName}>
          <div className={heroCopyClassName}>
            <span className={eyebrowClassName}><Icon name="settings" /> Application status</span>
            <h1 className={titleClassName}>About Joii</h1>
            <p className={subtitleClassName}>
              Version, runtime, and deployment details for the shared travel planning cockpit.
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
              <span className={labelClassName}>Deployment track</span>
              <strong className={detailValueClassName}>{webVersion.environment}</strong>
            </div>
          </div>
        </header>

        <section className={sectionClassName} aria-labelledby="version-heading">
          <h2 className={sectionTitleClassName} id="version-heading">Application versions</h2>
          <div className={versionGridClassName}>
            <VersionPanel
              label="Web app version"
              icon="layout"
              value={`${webVersion.service} v${webVersion.version}`}
              details={[
                ["Build SHA", webVersion.buildSha],
                ["Build time", webVersion.buildTime],
              ]}
            />
            <VersionPanel
              label="API version"
              icon="cloud"
              value={apiValue ? `${apiValue.service} v${apiValue.version}` : apiVersion.status === "loading" ? "Checking API version" : "API version unavailable"}
              muted={!apiValue}
              details={[
                ["Build SHA", apiValue?.buildSha ?? "unavailable"],
                ["Build time", apiValue?.buildTime ?? "unavailable"],
              ]}
            />
          </div>
        </section>

        <section className={sectionClassName} aria-labelledby="details-heading">
          <h2 className={sectionTitleClassName} id="details-heading">System details</h2>
          <div className={detailGridClassName}>
            <DetailRow label="Environment" value={apiValue?.environment ?? webVersion.environment} />
            <DetailRow label="Runtime mode" value={webVersion.runtimeMode} />
            <DetailRow label="API host" value={webVersion.apiHost} />
            <DetailRow label="Schema version" value={apiValue?.schemaVersion ?? webVersion.schemaVersion} />
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
