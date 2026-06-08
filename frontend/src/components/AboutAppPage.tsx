"use client";

import { useEffect, useState } from "react";
import type { ApiVersionInfo, WebVersionInfo } from "@/src/app-version";
import { cn } from "@/src/lib/cn";

interface AboutAppPageProps {
  webVersion: WebVersionInfo;
}

type ApiVersionState =
  | { status: "loading" }
  | { status: "ready"; value: ApiVersionInfo }
  | { status: "unavailable" };

const pageClassName = "min-h-screen bg-(--color-page) px-4 py-6 text-(--color-text) sm:px-6 lg:px-8";
const shellClassName = "mx-auto grid w-full max-w-5xl gap-5";
const headerClassName = "grid gap-2 border-b border-(--color-border) pb-5";
const eyebrowClassName = "text-xs font-extrabold uppercase text-(--color-primary-strong)";
const titleClassName = "m-0 text-3xl font-extrabold leading-tight text-(--color-text)";
const subtitleClassName = "m-0 max-w-2xl text-sm font-medium leading-6 text-(--color-text-muted)";
const sectionClassName = "grid gap-3";
const sectionTitleClassName = "m-0 text-base font-extrabold leading-6 text-(--color-text)";
const versionGridClassName = "grid gap-3 md:grid-cols-2";
const panelClassName = "grid gap-3 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-4";
const panelHeaderClassName = "grid gap-1";
const labelClassName = "text-xs font-extrabold uppercase text-(--color-text-muted)";
const valueClassName = "break-words text-lg font-extrabold leading-7 text-(--color-text)";
const detailGridClassName = "grid gap-2 sm:grid-cols-2";
const detailRowClassName = "grid gap-1 rounded-(--radius-sm) bg-(--color-surface-subtle) px-3 py-2";
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

  return (
    <main className={pageClassName}>
      <div className={shellClassName}>
        <header className={headerClassName}>
          <span className={eyebrowClassName}>Application status</span>
          <h1 className={titleClassName}>About Joii</h1>
          <p className={subtitleClassName}>
            Version and deployment details for the travel planning cockpit.
          </p>
        </header>

        <section className={sectionClassName} aria-labelledby="version-heading">
          <h2 className={sectionTitleClassName} id="version-heading">Application versions</h2>
          <div className={versionGridClassName}>
            <VersionPanel
              label="Web app version"
              value={`${webVersion.service} v${webVersion.version}`}
              details={[
                ["Build SHA", webVersion.buildSha],
                ["Build time", webVersion.buildTime],
              ]}
            />
            <VersionPanel
              label="API version"
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
  label: string;
  muted?: boolean;
  value: string;
}

function VersionPanel({ details, label, muted = false, value }: VersionPanelProps) {
  return (
    <article className={panelClassName}>
      <div className={panelHeaderClassName}>
        <span className={labelClassName}>{label}</span>
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
