const requiredBooleanChecks = [
  ["SAGITTARIUS_STAGING_PREFLIGHT_PASSED", "staging preflight passed"],
  ["SAGITTARIUS_STAGING_BROWSER_SIGNOFF", "deployed staging browser journeys passed"],
  ["SAGITTARIUS_STAGING_DB_MIGRATION_VERIFIED", "staging DB migration verified"],
  ["SAGITTARIUS_STAGING_ROLLBACK_VERIFIED", "staging rollback verified"],
  ["SAGITTARIUS_STAGING_ALERT_ROUTING_VERIFIED", "write-operation alerts routed"],
  ["SAGITTARIUS_STAGING_NO_P1_P2", "no known P1/P2 regressions"],
] as const;

const requiredTextChecks = [
  ["SAGITTARIUS_STAGING_ENVIRONMENT", "staging environment name"],
  ["SAGITTARIUS_STAGING_API_BASE_URL", "staging API base URL"],
  ["SAGITTARIUS_STAGING_FRONTEND_URL", "staging frontend URL"],
  ["SAGITTARIUS_STAGING_EVIDENCE_URL", "evidence or run URL"],
  ["SAGITTARIUS_STAGING_MIGRATION_EVIDENCE_URL", "migration evidence URL"],
  ["SAGITTARIUS_STAGING_ROLLBACK_EVIDENCE_URL", "rollback evidence URL"],
  ["SAGITTARIUS_STAGING_ALERT_EVIDENCE_URL", "alert routing evidence URL"],
  ["SAGITTARIUS_FEATURE_OWNER", "feature owner"],
  ["SAGITTARIUS_ROLLBACK_OWNER", "rollback owner"],
] as const;

const failures: string[] = [];

for (const [name, label] of requiredBooleanChecks) {
  if (process.env[name] !== "1") {
    failures.push(`${name}=1 is required (${label})`);
  }
}

for (const [name, label] of requiredTextChecks) {
  if (!process.env[name]?.trim()) {
    failures.push(`${name} is required (${label})`);
  }
}

checkEnvironment(process.env.SAGITTARIUS_STAGING_ENVIRONMENT ?? "");
checkPublicHttpsUrl("SAGITTARIUS_STAGING_API_BASE_URL", process.env.SAGITTARIUS_STAGING_API_BASE_URL ?? "");
checkPublicHttpsUrl(
  "SAGITTARIUS_STAGING_FRONTEND_URL",
  process.env.SAGITTARIUS_STAGING_FRONTEND_URL ?? "",
);
checkEvidenceUrl("SAGITTARIUS_STAGING_EVIDENCE_URL", process.env.SAGITTARIUS_STAGING_EVIDENCE_URL ?? "");
checkEvidenceUrl(
  "SAGITTARIUS_STAGING_MIGRATION_EVIDENCE_URL",
  process.env.SAGITTARIUS_STAGING_MIGRATION_EVIDENCE_URL ?? "",
);
checkEvidenceUrl(
  "SAGITTARIUS_STAGING_ROLLBACK_EVIDENCE_URL",
  process.env.SAGITTARIUS_STAGING_ROLLBACK_EVIDENCE_URL ?? "",
);
checkEvidenceUrl(
  "SAGITTARIUS_STAGING_ALERT_EVIDENCE_URL",
  process.env.SAGITTARIUS_STAGING_ALERT_EVIDENCE_URL ?? "",
);
checkOwner("SAGITTARIUS_FEATURE_OWNER", process.env.SAGITTARIUS_FEATURE_OWNER ?? "");
checkOwner("SAGITTARIUS_ROLLBACK_OWNER", process.env.SAGITTARIUS_ROLLBACK_OWNER ?? "");

if (failures.length) {
  throw new Error(`Staging sign-off failed:\n- ${failures.join("\n- ")}`);
}

const summary = [
  "# Sagittarius Staging Sign-off Evidence",
  "",
  `- Environment: ${process.env.SAGITTARIUS_STAGING_ENVIRONMENT}`,
  `- Frontend: ${process.env.SAGITTARIUS_STAGING_FRONTEND_URL}`,
  `- API: ${process.env.SAGITTARIUS_STAGING_API_BASE_URL}`,
  `- Evidence: ${process.env.SAGITTARIUS_STAGING_EVIDENCE_URL}`,
  `- Migration evidence: ${process.env.SAGITTARIUS_STAGING_MIGRATION_EVIDENCE_URL}`,
  `- Rollback evidence: ${process.env.SAGITTARIUS_STAGING_ROLLBACK_EVIDENCE_URL}`,
  `- Alert evidence: ${process.env.SAGITTARIUS_STAGING_ALERT_EVIDENCE_URL}`,
  `- Feature owner: ${process.env.SAGITTARIUS_FEATURE_OWNER}`,
  `- Rollback owner: ${process.env.SAGITTARIUS_ROLLBACK_OWNER}`,
  "",
  "## Passed Gates",
  "",
  ...requiredBooleanChecks.map(([, label]) => `- ${label}`),
  "",
  "staging sign-off ok",
].join("\n");

console.log(summary);

function checkEnvironment(value: string) {
  if (!value) return;
  const lower = value.toLowerCase();
  if (!lower.includes("staging") && !lower.includes("test")) {
    failures.push("SAGITTARIUS_STAGING_ENVIRONMENT must name a staging/test environment");
  }
  if (lower.includes("prod")) {
    failures.push("SAGITTARIUS_STAGING_ENVIRONMENT must not be production");
  }
}

function checkPublicHttpsUrl(name: string, value: string) {
  if (!value) return;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    failures.push(`${name} must be a valid URL`);
    return;
  }
  if (url.protocol !== "https:") {
    failures.push(`${name} must use https://`);
  }
  if (["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
    failures.push(`${name} must not point at localhost`);
  }
}

function checkEvidenceUrl(name: string, value: string) {
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
