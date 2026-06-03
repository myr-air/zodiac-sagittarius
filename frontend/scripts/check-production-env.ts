const failures: string[] = [];

const databaseUrl = requiredEnv("DATABASE_URL");
const apiBaseUrl = requiredEnv("NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL");
const allowedOrigins = requiredEnv("SAGITTARIUS_ALLOWED_ORIGINS");
const passkeyAllowedOrigins = requiredEnv("PASSKEY_ALLOWED_ORIGINS");
const emailDelivery = requiredEnv("EMAIL_DELIVERY");
const rustLog = requiredEnv("RUST_LOG");
const evidenceUrl = requiredEnv("SAGITTARIUS_STAGING_EVIDENCE_URL");
const browserEvidenceUrl = requiredEnv("SAGITTARIUS_STAGING_BROWSER_EVIDENCE_URL");
const migrationEvidenceUrl = requiredEnv("SAGITTARIUS_STAGING_MIGRATION_EVIDENCE_URL");
const rollbackEvidenceUrl = requiredEnv("SAGITTARIUS_STAGING_ROLLBACK_EVIDENCE_URL");
const issueEvidenceUrl = requiredEnv("SAGITTARIUS_STAGING_ISSUE_EVIDENCE_URL");
const alertSinkName = requiredEnv("SAGITTARIUS_ALERT_SINK_NAME");
const alertRunbookUrl = requiredEnv("SAGITTARIUS_ALERT_RUNBOOK_URL");
const featureOwner = requiredEnv("SAGITTARIUS_FEATURE_OWNER");
const rollbackOwner = requiredEnv("SAGITTARIUS_ROLLBACK_OWNER");

checkDatabaseUrl(databaseUrl);
checkApiBaseUrl(apiBaseUrl);
checkAllowedOrigins("SAGITTARIUS_ALLOWED_ORIGINS", allowedOrigins, apiBaseUrl);
checkAllowedOrigins("PASSKEY_ALLOWED_ORIGINS", passkeyAllowedOrigins, "");
checkEmailDelivery(emailDelivery);
checkRustLog(rustLog);
checkEvidence("SAGITTARIUS_STAGING_EVIDENCE_URL", evidenceUrl);
checkEvidence("SAGITTARIUS_STAGING_BROWSER_EVIDENCE_URL", browserEvidenceUrl);
checkEvidence("SAGITTARIUS_STAGING_MIGRATION_EVIDENCE_URL", migrationEvidenceUrl);
checkEvidence("SAGITTARIUS_STAGING_ROLLBACK_EVIDENCE_URL", rollbackEvidenceUrl);
checkEvidence("SAGITTARIUS_STAGING_ISSUE_EVIDENCE_URL", issueEvidenceUrl);
checkAlertSink(alertSinkName);
checkEvidence("SAGITTARIUS_ALERT_RUNBOOK_URL", alertRunbookUrl);
checkOwner("SAGITTARIUS_FEATURE_OWNER", featureOwner);
checkOwner("SAGITTARIUS_ROLLBACK_OWNER", rollbackOwner);

for (const name of [
  "SAGITTARIUS_STAGING_PREFLIGHT_PASSED",
  "SAGITTARIUS_STAGING_BROWSER_SIGNOFF",
  "SAGITTARIUS_STAGING_DB_MIGRATION_VERIFIED",
  "SAGITTARIUS_STAGING_ROLLBACK_VERIFIED",
  "SAGITTARIUS_STAGING_ALERT_ROUTING_VERIFIED",
  "SAGITTARIUS_STAGING_NO_P1_P2",
]) {
  if (process.env[name] !== "1") failures.push(`${name}=1 is required before production deploy`);
}

if (failures.length) {
  throw new Error(`Production environment check failed:\n- ${failures.join("\n- ")}`);
}

console.log("production env check ok");

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    failures.push(`${name} is required`);
    return "";
  }
  return value;
}

function checkDatabaseUrl(value: string) {
  if (!value) return;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    failures.push("DATABASE_URL must be a valid postgres URL");
    return;
  }

  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    failures.push("DATABASE_URL must use postgres:// or postgresql://");
  }
  if (["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
    failures.push("DATABASE_URL must not point at localhost for production");
  }

  const databaseName = url.pathname.replace(/^\//, "").toLowerCase();
  const lowerUrl = value.toLowerCase();
  if (databaseName.includes("test") || databaseName.includes("staging") || lowerUrl.includes("sagittarius_test")) {
    failures.push("DATABASE_URL must not point at test/staging database for production");
  }
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
    failures.push("NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL must use https:// for production");
  }
  if (["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
    failures.push("NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL must not point at localhost for production");
  }
}

function checkAllowedOrigins(name: string, value: string, apiValue: string) {
  if (!value) return;
  const origins = value.split(",").map((origin) => origin.trim()).filter(Boolean);
  if (!origins.length) {
    failures.push(`${name} must include at least one production frontend origin`);
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
      failures.push(`${name} must use https:// origins for production: ${origin}`);
    }
    if (["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
      failures.push(`${name} must not include localhost for production: ${origin}`);
    }
  }

  if (apiValue && origins.includes(apiValue)) {
    failures.push(`${name} should contain frontend origins, not the API base URL`);
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
    for (const name of ["SMTP_HOST", "SMTP_USERNAME", "SMTP_PASSWORD", "EMAIL_FROM"]) {
      if (!process.env[name]?.trim()) failures.push(`${name} is required when EMAIL_DELIVERY=smtp`);
    }
    const port = process.env.SMTP_PORT?.trim();
    if (port && !Number.isInteger(Number(port))) {
      failures.push("SMTP_PORT must be an integer when set");
    }
  }

  if (mode === "sendmail") {
    for (const name of ["SENDMAIL_COMMAND", "EMAIL_FROM"]) {
      if (!process.env[name]?.trim()) failures.push(`${name} is required when EMAIL_DELIVERY=sendmail`);
    }
  }
}

function checkRustLog(value: string) {
  if (!value) return;
  if (!value.includes("tower_http")) {
    failures.push("RUST_LOG must include tower_http for production HTTP tracing");
  }
  if (!value.includes("sagittarius_api")) {
    failures.push("RUST_LOG must include sagittarius_api for production API logs");
  }
  if (!value.includes("info")) {
    failures.push("RUST_LOG must include info level for production trace visibility");
  }
}

function checkEvidence(name: string, value: string) {
  if (!value) return;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) failures.push(`${name} must be an http(s) URL`);
  } catch {
    failures.push(`${name} must be a valid evidence URL`);
  }
}

function checkAlertSink(value: string) {
  if (!value) return;
  if (value.length < 3 || /^tbd$/i.test(value)) {
    failures.push("SAGITTARIUS_ALERT_SINK_NAME must name a real alert sink, not TBD");
  }
}

function checkOwner(name: string, value: string) {
  if (!value) return;
  if (value.length < 3 || /^tbd$/i.test(value)) {
    failures.push(`${name} must be a real owner, not TBD`);
  }
}

export {};
