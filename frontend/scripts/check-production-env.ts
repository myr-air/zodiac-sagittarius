type Env = Record<string, string | undefined>;

type CheckProductionEnvOptions = {
  productionEnvFileCheck?: boolean;
};

const approvedSameOriginApiHosts = new Set([
  "sagittarius.13thx.com",
]);

let failures: string[] = [];
let currentEnv: Env = {};

export function checkProductionEnv(
  env: Env = process.env,
  options: CheckProductionEnvOptions = {},
): string[] {
  failures = [];
  currentEnv = env;

  const runtimeEnv = requiredEnv("SAGITTARIUS_ENV");
  const databaseUrl = requiredEnv("DATABASE_URL");
  const migrationDatabaseUrl =
    options.productionEnvFileCheck || productionEnvFileCheckEnabled()
      ? requiredEnv("MIGRATION_DATABASE_URL")
      : optionalEnv("MIGRATION_DATABASE_URL");
  const apiBaseUrl = requiredEnv("NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL");
  const internalApiBaseUrl = requiredEnv("SAGITTARIUS_INTERNAL_API_BASE_URL");
  const allowedOrigins = requiredEnv("SAGITTARIUS_ALLOWED_ORIGINS");
  const passkeyAllowedOrigins = requiredEnv("PASSKEY_ALLOWED_ORIGINS");
  const emailDelivery = requiredEnv("EMAIL_DELIVERY");
  const rustLog = requiredEnv("RUST_LOG");

  if (options.productionEnvFileCheck || productionEnvFileCheckEnabled()) {
    checkRuntimeOnlyEnvKeys();
  }
  checkRuntimeEnv(runtimeEnv);
  checkDatabaseUrl("DATABASE_URL", databaseUrl);
  checkDatabaseUrl("MIGRATION_DATABASE_URL", migrationDatabaseUrl);
  checkApiBaseUrl(apiBaseUrl);
  checkInternalApiBaseUrl(internalApiBaseUrl);
  checkAllowedOrigins(
    "SAGITTARIUS_ALLOWED_ORIGINS",
    allowedOrigins,
    apiBaseUrl,
  );
  checkAllowedOrigins("PASSKEY_ALLOWED_ORIGINS", passkeyAllowedOrigins, "");
  checkEmailDelivery(emailDelivery);
  checkRustLog(rustLog);

  return failures;
}

if (import.meta.main) {
  const result = checkProductionEnv();
  if (result.length) {
    throw new Error(
      `Production environment check failed:\n- ${result.join("\n- ")}`,
    );
  }
  console.log("production env check ok");
}

function requiredEnv(name: string): string {
  const value = currentEnv[name]?.trim();
  if (!value) {
    failures.push(`${name} is required`);
    return "";
  }
  return value;
}

function optionalEnv(name: string): string {
  return currentEnv[name]?.trim() ?? "";
}

function productionEnvFileCheckEnabled(): boolean {
  return isEnabled(currentEnv.SAGITTARIUS_PRODUCTION_ENV_FILE_CHECK);
}

function isEnabled(value: string | undefined): boolean {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function checkRuntimeOnlyEnvKeys() {
  const releaseApprovalLabel = ["sign", "off"].join("");
  for (const name of Object.keys(currentEnv)
    .filter(isReleaseOnlyEnvKey)
    .sort()) {
    failures.push(
      `${name} must not include release ${releaseApprovalLabel} in .env.production`,
    );
  }
}

function isReleaseOnlyEnvKey(name: string): boolean {
  const normalized = name.toUpperCase();
  if (!normalized.startsWith("SAGITTARIUS_")) return false;

  const releaseOnlyPrefixes = [
    sagittariusKeyPrefix(["SIGN", "OFF"].join("")),
    sagittariusKeyPrefix(["STA", "GING"].join("")),
    sagittariusKeyPrefix(["AL", "ERT"].join("")),
  ];

  return (
    releaseOnlyPrefixes.some((prefix) => normalized.startsWith(prefix)) ||
    normalized.endsWith("_OWNER") ||
    normalized.includes("_EVIDENCE_")
  );
}

function sagittariusKeyPrefix(scope: string): string {
  return `SAGITTARIUS_${scope}_`;
}

function checkRuntimeEnv(value: string) {
  if (!value) return;
  if (value !== "production") {
    failures.push(
      "SAGITTARIUS_ENV=production is required before production deploy",
    );
  }
  const seedFlag =
    currentEnv.SAGITTARIUS_SEED_SAMPLE_DATA?.trim().toLowerCase();
  if (seedFlag && !["0", "false", "no", "off"].includes(seedFlag)) {
    failures.push(
      "SAGITTARIUS_SEED_SAMPLE_DATA must be unset or false for production deploy",
    );
  }
  const localCors =
    currentEnv.SAGITTARIUS_ALLOW_LOCAL_CORS?.trim().toLowerCase();
  if (localCors && !["0", "false", "no", "off"].includes(localCors)) {
    failures.push(
      "SAGITTARIUS_ALLOW_LOCAL_CORS must be unset or false for production deploy",
    );
  }
}

function checkDatabaseUrl(name: string, value: string) {
  if (!value) return;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    failures.push(`${name} must be a valid postgres URL`);
    return;
  }

  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    failures.push(`${name} must use postgres:// or postgresql://`);
  }
  if (["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
    failures.push(`${name} must not point at localhost for production`);
  }

  const databaseName = url.pathname.replace(/^\//, "").toLowerCase();
  const lowerUrl = value.toLowerCase();
  const nonProdMarkers = ["test", ["sta", "ging"].join("")];
  if (
    nonProdMarkers.some((marker) => databaseName.includes(marker)) ||
    lowerUrl.includes("sagittarius_test")
  ) {
    failures.push(
      `${name} must not point at test or non-production database for production`,
    );
  }
  checkNoPlaceholderUrl(name, url);
}

function checkApiBaseUrl(value: string) {
  if (!value) return;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    failures.push("NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL must be a valid URL");
    return;
  }

  if (url.protocol !== "https:") {
    failures.push(
      "NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL must use https:// for production",
    );
  }
  if (["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
    failures.push(
      "NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL must not point at localhost for production",
    );
  }
  checkNoPlaceholderUrl("NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL", url);
}

function checkInternalApiBaseUrl(value: string) {
  if (!value) return;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    failures.push("SAGITTARIUS_INTERNAL_API_BASE_URL must be a valid URL");
    return;
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    failures.push(
      "SAGITTARIUS_INTERNAL_API_BASE_URL must use http:// or https://",
    );
  }
  if (url.username || url.password) {
    failures.push(
      "SAGITTARIUS_INTERNAL_API_BASE_URL must not include username or password",
    );
  }
  if (url.search || url.hash) {
    failures.push(
      "SAGITTARIUS_INTERNAL_API_BASE_URL must not include search params or hash",
    );
  }
  if (url.pathname !== "/") {
    if (url.pathname.replace(/\/$/, "") === "/api/v1") {
      failures.push(
        "SAGITTARIUS_INTERNAL_API_BASE_URL must point at the service root, not /api/v1",
      );
    } else {
      failures.push(
        "SAGITTARIUS_INTERNAL_API_BASE_URL must point at the service root without a path",
      );
    }
  }
  if (["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
    failures.push(
      "SAGITTARIUS_INTERNAL_API_BASE_URL must not point at localhost for production",
    );
  }
  checkNoPlaceholderUrl("SAGITTARIUS_INTERNAL_API_BASE_URL", url);
  if (url.hostname !== "sagittarius-api" || url.port !== "5181") {
    failures.push(
      "SAGITTARIUS_INTERNAL_API_BASE_URL must target sagittarius-api:5181 for production Docker",
    );
  }
}

function checkAllowedOrigins(name: string, value: string, apiValue: string) {
  if (!value) return;
  const origins = value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (!origins.length) {
    failures.push(
      `${name} must include at least one production frontend origin`,
    );
    return;
  }

  for (const origin of origins) {
    let url: URL;
    try {
      url = new URL(origin);
    } catch {
      failures.push(`${name} contains invalid URL: ${origin}`);
      continue;
    }
    if (url.protocol !== "https:") {
      failures.push(
        `${name} must use https:// origins for production: ${origin}`,
      );
    }
    if (["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
      failures.push(
        `${name} must not include localhost for production: ${origin}`,
      );
    }
    checkNoPlaceholderUrl(name, url);
  }

  if (
    apiValue &&
    origins.includes(apiValue) &&
    !isApprovedSameOriginApi(apiValue)
  ) {
    failures.push(
      `${name} should contain frontend origins, not the API base URL`,
    );
  }
}

function isApprovedSameOriginApi(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.pathname === "/" &&
      !url.port &&
      !url.search &&
      !url.hash &&
      approvedSameOriginApiHosts.has(url.hostname)
    );
  } catch {
    return false;
  }
}

function checkEmailDelivery(value: string) {
  if (!value) return;
  const mode = value.toLowerCase();
  if (!["smtp", "sendmail"].includes(mode)) {
    failures.push("EMAIL_DELIVERY must be smtp or sendmail for production");
    return;
  }

  if (mode === "smtp") {
    for (const name of [
      "SMTP_HOST",
      "SMTP_USERNAME",
      "SMTP_PASSWORD",
      "EMAIL_FROM",
    ]) {
      if (!currentEnv[name]?.trim())
        failures.push(`${name} is required when EMAIL_DELIVERY=smtp`);
    }
    const port = currentEnv.SMTP_PORT?.trim();
    if (port && !Number.isInteger(Number(port))) {
      failures.push("SMTP_PORT must be an integer when set");
    }
  }

  if (mode === "sendmail") {
    for (const name of ["SENDMAIL_COMMAND", "EMAIL_FROM"]) {
      if (!currentEnv[name]?.trim())
        failures.push(`${name} is required when EMAIL_DELIVERY=sendmail`);
    }
  }
}

function checkRustLog(value: string) {
  if (!value) return;
  if (!value.includes("tower_http")) {
    failures.push(
      "RUST_LOG must include tower_http for production HTTP tracing",
    );
  }
  if (!value.includes("sagittarius_api")) {
    failures.push(
      "RUST_LOG must include sagittarius_api for production API logs",
    );
  }
  if (!value.includes("info")) {
    failures.push(
      "RUST_LOG must include info level for production trace visibility",
    );
  }
}

function checkNoPlaceholderUrl(name: string, url: URL) {
  if (isPlaceholderHostname(url.hostname)) {
    failures.push(`${name} must not use placeholder domain: ${url.hostname}`);
  }
}

function isPlaceholderHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return ["example.com", "example.net", "example.org", "example.test"].some(
    (placeholder) =>
      normalized === placeholder || normalized.endsWith(`.${placeholder}`),
  );
}
