import type { ApiVersionInfo, WebVersionInfo } from "@/src/app-version";
import type { IconName } from "@/src/ui/icons";

export type ApiVersionState =
  | { status: "loading" }
  | { status: "ready"; value: ApiVersionInfo }
  | { status: "unavailable" };

export interface AboutAppPageLabels {
  apiHost: string;
  apiVersion: string;
  apiVersionUnavailable: string;
  buildSha: string;
  buildTime: string;
  checkingApiVersion: string;
  environment: string;
  runtimeMode: string;
  schemaVersion: string;
  status: {
    checking: string;
    connected: string;
    unavailable: string;
  };
  unavailableValue: string;
  webVersion: string;
}

export interface AboutStatusModel {
  icon: Extract<IconName, "check" | "clock" | "warning">;
  label: string;
  tone: ApiVersionState["status"];
}

export interface AboutVersionPanelModel {
  details: Array<[string, string]>;
  icon: Extract<IconName, "cloud" | "layout">;
  label: string;
  muted?: boolean;
  value: string;
}

export interface AboutDetailRowModel {
  label: string;
  value: string;
}

export function aboutApiVersionValue(apiVersion: ApiVersionState): ApiVersionInfo | null {
  return apiVersion.status === "ready" ? apiVersion.value : null;
}

export function buildAboutStatusModel(
  apiVersion: ApiVersionState,
  labels: AboutAppPageLabels,
): AboutStatusModel {
  if (apiVersion.status === "ready") {
    return {
      icon: "check",
      label: labels.status.connected,
      tone: "ready",
    };
  }
  if (apiVersion.status === "loading") {
    return {
      icon: "clock",
      label: labels.status.checking,
      tone: "loading",
    };
  }
  return {
    icon: "warning",
    label: labels.status.unavailable,
    tone: "unavailable",
  };
}

export function buildAboutVersionPanels({
  apiVersion,
  labels,
  webVersion,
}: {
  apiVersion: ApiVersionState;
  labels: AboutAppPageLabels;
  webVersion: WebVersionInfo;
}): AboutVersionPanelModel[] {
  const apiValue = aboutApiVersionValue(apiVersion);
  return [
    {
      details: [
        [labels.buildSha, webVersion.buildSha],
        [labels.buildTime, webVersion.buildTime],
      ],
      icon: "layout",
      label: labels.webVersion,
      value: `${webVersion.service} v${webVersion.version}`,
    },
    {
      details: [
        [labels.buildSha, apiValue?.buildSha ?? labels.unavailableValue],
        [labels.buildTime, apiValue?.buildTime ?? labels.unavailableValue],
      ],
      icon: "cloud",
      label: labels.apiVersion,
      muted: !apiValue,
      value: apiValue
        ? `${apiValue.service} v${apiValue.version}`
        : apiVersion.status === "loading"
          ? labels.checkingApiVersion
          : labels.apiVersionUnavailable,
    },
  ];
}

export function buildAboutDetailRows({
  apiVersion,
  labels,
  webVersion,
}: {
  apiVersion: ApiVersionState;
  labels: AboutAppPageLabels;
  webVersion: WebVersionInfo;
}): AboutDetailRowModel[] {
  const apiValue = aboutApiVersionValue(apiVersion);
  return [
    {
      label: labels.environment,
      value: apiValue?.environment ?? webVersion.environment,
    },
    {
      label: labels.runtimeMode,
      value: webVersion.runtimeMode,
    },
    {
      label: labels.apiHost,
      value: webVersion.apiHost,
    },
    {
      label: labels.schemaVersion,
      value: apiValue?.schemaVersion ?? webVersion.schemaVersion,
    },
  ];
}
