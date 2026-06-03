const failures: string[] = [];

const databaseUrl = requiredEnv("DATABASE_URL");
const apiBaseUrl = requiredEnv("NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL");
const rustLog = requiredEnv("RUST_LOG");
const evidenceUrl = requiredEnv("SAGITTARIUS_STAGING_EVIDENCE_URL");
const featureOwner = requiredEnv("SAGITTARIUS_FEATURE_OWNER");
const rollbackOwner = requiredEnv("SAGITTARIUS_ROLLBACK_OWNER");

checkDatabaseUrl(databaseUrl);
checkApiBaseUrl(apiBaseUrl);
checkRustLog(rustLog);
checkEvidence("SAGITTARIUS_STAGING_EVIDENCE_URL", evidenceUrl);
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

function checkOwner(name: string, value: string) {
  if (!value) return;
  if (value.length < 3 || /^tbd$/i.test(value)) {
    failures.push(`${name} must be a real owner, not TBD`);
  }
}

export {};
