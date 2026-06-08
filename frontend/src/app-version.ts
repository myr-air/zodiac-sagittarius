import packageJson from "../package.json";

export interface WebVersionInfo {
  apiHost: string;
  apiVersionUrl: string;
  buildSha: string;
  buildTime: string;
  environment: string;
  runtimeMode: string;
  schemaVersion: string;
  service: string;
  version: string;
}

export interface ApiVersionInfo {
  buildSha: string;
  buildTime: string;
  environment: string;
  schemaVersion: string;
  service: string;
  version: string;
}

const unavailable = "unavailable";

function cleanEnv(value: string | undefined): string {
  return value?.trim() || unavailable;
}

function resolveApiHost(rawBaseUrl: string | undefined): string {
  const value = rawBaseUrl?.trim();
  if (!value) return "local";

  try {
    return new URL(value).host;
  } catch {
    return "invalid API host";
  }
}

function resolveApiVersionUrl(rawBaseUrl: string | undefined): string {
  const value = rawBaseUrl?.trim();
  if (!value) return "/api/v1/version";

  try {
    return new URL("/api/v1/version", value).toString();
  } catch {
    return "/api/v1/version";
  }
}

export function getWebAppVersionInfo(): WebVersionInfo {
  const publicApiBaseUrl = process.env.NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL;
  const internalApiBaseUrl = process.env.SAGITTARIUS_INTERNAL_API_BASE_URL;

  return {
    apiHost: resolveApiHost(publicApiBaseUrl ?? internalApiBaseUrl),
    apiVersionUrl: resolveApiVersionUrl(publicApiBaseUrl),
    buildSha: cleanEnv(process.env.NEXT_PUBLIC_SAGITTARIUS_BUILD_SHA),
    buildTime: cleanEnv(process.env.NEXT_PUBLIC_SAGITTARIUS_BUILD_TIME),
    environment: process.env.NEXT_PUBLIC_SAGITTARIUS_ENVIRONMENT?.trim() || process.env.NODE_ENV || "local",
    runtimeMode: publicApiBaseUrl || internalApiBaseUrl ? "api" : "local",
    schemaVersion: "frontend-static",
    service: "sagittarius-web",
    version: packageJson.version,
  };
}
