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
