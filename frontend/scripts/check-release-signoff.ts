type Env = Record<string, string | undefined>;

type RequiredCheck = {
  aliases?: string[];
  label: string;
  name: string;
};

const requiredBooleanChecks: RequiredCheck[] = [
  {
    aliases: ["SAGITTARIUS_STAGING_PREFLIGHT_PASSED"],
    label: "preflight passed",
    name: "SAGITTARIUS_SIGNOFF_PREFLIGHT_PASSED",
  },
  {
    aliases: ["SAGITTARIUS_STAGING_BROWSER_SIGNOFF"],
    label: "browser journeys passed",
    name: "SAGITTARIUS_SIGNOFF_BROWSER_PASSED",
  },
  {
    aliases: ["SAGITTARIUS_STAGING_DB_MIGRATION_VERIFIED"],
    label: "DB migration verified",
    name: "SAGITTARIUS_SIGNOFF_DB_MIGRATION_VERIFIED",
  },
  {
    aliases: ["SAGITTARIUS_STAGING_ROLLBACK_VERIFIED"],
    label: "rollback verified",
    name: "SAGITTARIUS_SIGNOFF_ROLLBACK_VERIFIED",
  },
  {
    aliases: ["SAGITTARIUS_STAGING_ALERT_ROUTING_VERIFIED"],
    label: "write-operation alerts routed",
    name: "SAGITTARIUS_SIGNOFF_ALERT_ROUTING_VERIFIED",
  },
  {
    aliases: ["SAGITTARIUS_STAGING_NO_P1_P2"],
    label: "no known P1/P2 regressions",
    name: "SAGITTARIUS_SIGNOFF_NO_P1_P2",
  },
];

const requiredTextChecks: RequiredCheck[] = [
  {
    aliases: ["SAGITTARIUS_STAGING_ENVIRONMENT"],
    label: "signoff environment name",
    name: "SAGITTARIUS_SIGNOFF_ENVIRONMENT",
  },
  {
    aliases: ["SAGITTARIUS_STAGING_API_BASE_URL"],
    label: "signoff API base URL",
    name: "SAGITTARIUS_SIGNOFF_API_BASE_URL",
  },
  {
    aliases: ["SAGITTARIUS_STAGING_FRONTEND_URL"],
    label: "signoff frontend URL",
    name: "SAGITTARIUS_SIGNOFF_FRONTEND_URL",
  },
  {
    aliases: ["SAGITTARIUS_STAGING_EVIDENCE_URL"],
    label: "evidence or run URL",
    name: "SAGITTARIUS_SIGNOFF_EVIDENCE_URL",
  },
  {
    aliases: ["SAGITTARIUS_STAGING_BROWSER_EVIDENCE_URL"],
    label: "browser journey evidence URL",
    name: "SAGITTARIUS_SIGNOFF_BROWSER_EVIDENCE_URL",
  },
  {
    aliases: ["SAGITTARIUS_STAGING_MIGRATION_EVIDENCE_URL"],
    label: "migration evidence URL",
    name: "SAGITTARIUS_SIGNOFF_MIGRATION_EVIDENCE_URL",
  },
  {
    aliases: ["SAGITTARIUS_STAGING_ROLLBACK_EVIDENCE_URL"],
    label: "rollback evidence URL",
    name: "SAGITTARIUS_SIGNOFF_ROLLBACK_EVIDENCE_URL",
  },
  {
    aliases: ["SAGITTARIUS_STAGING_ALERT_EVIDENCE_URL"],
    label: "alert routing evidence URL",
    name: "SAGITTARIUS_SIGNOFF_ALERT_EVIDENCE_URL",
  },
  {
    aliases: ["SAGITTARIUS_STAGING_ISSUE_EVIDENCE_URL"],
    label: "no P1/P2 issue evidence URL",
    name: "SAGITTARIUS_SIGNOFF_ISSUE_EVIDENCE_URL",
  },
  { label: "alert sink name", name: "SAGITTARIUS_ALERT_SINK_NAME" },
  { label: "alert runbook URL", name: "SAGITTARIUS_ALERT_RUNBOOK_URL" },
  { label: "feature owner", name: "SAGITTARIUS_FEATURE_OWNER" },
  { label: "rollback owner", name: "SAGITTARIUS_ROLLBACK_OWNER" },
];

const failures: string[] = [];
const env: Env = process.env;

for (const check of requiredBooleanChecks) {
  const value = envValue(check);
  if (value !== "1") {
    failures.push(`${check.name}=1 is required (${check.label})`);
  }
}

for (const check of requiredTextChecks) {
  if (!envValue(check)) {
    failures.push(`${check.name} is required (${check.label})`);
  }
}

checkEnvironment(
  envValue({
    aliases: ["SAGITTARIUS_STAGING_ENVIRONMENT"],
    label: "signoff environment name",
    name: "SAGITTARIUS_SIGNOFF_ENVIRONMENT",
  }),
);
checkPublicHttpsUrl(
  "SAGITTARIUS_SIGNOFF_API_BASE_URL",
  envValue({
    aliases: ["SAGITTARIUS_STAGING_API_BASE_URL"],
    label: "signoff API base URL",
    name: "SAGITTARIUS_SIGNOFF_API_BASE_URL",
  }),
);
checkPublicHttpsUrl(
  "SAGITTARIUS_SIGNOFF_FRONTEND_URL",
  envValue({
    aliases: ["SAGITTARIUS_STAGING_FRONTEND_URL"],
    label: "signoff frontend URL",
    name: "SAGITTARIUS_SIGNOFF_FRONTEND_URL",
  }),
);

for (const name of [
  "SAGITTARIUS_SIGNOFF_EVIDENCE_URL",
  "SAGITTARIUS_SIGNOFF_BROWSER_EVIDENCE_URL",
  "SAGITTARIUS_SIGNOFF_MIGRATION_EVIDENCE_URL",
  "SAGITTARIUS_SIGNOFF_ROLLBACK_EVIDENCE_URL",
  "SAGITTARIUS_SIGNOFF_ALERT_EVIDENCE_URL",
  "SAGITTARIUS_SIGNOFF_ISSUE_EVIDENCE_URL",
  "SAGITTARIUS_ALERT_RUNBOOK_URL",
] as const) {
  const check = requiredTextChecks.find((candidate) => candidate.name === name);
  checkEvidenceUrl(name, check ? envValue(check) : "");
}

checkAlertSink(
  envValue({
    label: "alert sink name",
    name: "SAGITTARIUS_ALERT_SINK_NAME",
  }),
);
checkOwner(
  "SAGITTARIUS_FEATURE_OWNER",
  envValue({ label: "feature owner", name: "SAGITTARIUS_FEATURE_OWNER" }),
);
checkOwner(
  "SAGITTARIUS_ROLLBACK_OWNER",
  envValue({ label: "rollback owner", name: "SAGITTARIUS_ROLLBACK_OWNER" }),
);

if (failures.length) {
  console.error(`Release signoff failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(summary());

function envValue(check: RequiredCheck): string {
  const primary = env[check.name]?.trim();
  if (primary) return primary;
  for (const alias of check.aliases ?? []) {
    const value = env[alias]?.trim();
    if (value) return value;
  }
  return "";
}

function summary(): string {
  const value = (name: string) =>
    envValue(
      requiredTextChecks.find((check) => check.name === name) ?? {
        label: name,
        name,
      },
    );

  return [
    "# Sagittarius Release Signoff Evidence",
    "",
    `- Environment: ${value("SAGITTARIUS_SIGNOFF_ENVIRONMENT")}`,
    `- Frontend: ${value("SAGITTARIUS_SIGNOFF_FRONTEND_URL")}`,
    `- API: ${value("SAGITTARIUS_SIGNOFF_API_BASE_URL")}`,
    `- Evidence: ${value("SAGITTARIUS_SIGNOFF_EVIDENCE_URL")}`,
    `- Browser evidence: ${value("SAGITTARIUS_SIGNOFF_BROWSER_EVIDENCE_URL")}`,
    `- Migration evidence: ${value("SAGITTARIUS_SIGNOFF_MIGRATION_EVIDENCE_URL")}`,
    `- Rollback evidence: ${value("SAGITTARIUS_SIGNOFF_ROLLBACK_EVIDENCE_URL")}`,
    `- Alert evidence: ${value("SAGITTARIUS_SIGNOFF_ALERT_EVIDENCE_URL")}`,
    `- Issue evidence: ${value("SAGITTARIUS_SIGNOFF_ISSUE_EVIDENCE_URL")}`,
    `- Alert sink: ${value("SAGITTARIUS_ALERT_SINK_NAME")}`,
    `- Alert runbook: ${value("SAGITTARIUS_ALERT_RUNBOOK_URL")}`,
    `- Feature owner: ${value("SAGITTARIUS_FEATURE_OWNER")}`,
    `- Rollback owner: ${value("SAGITTARIUS_ROLLBACK_OWNER")}`,
    "",
    "## Passed Gates",
    "",
    ...requiredBooleanChecks.map((check) => `- ${check.label}`),
    "",
    "release signoff ok",
  ].join("\n");
}

function checkEnvironment(value: string) {
  if (!value) return;
  const lower = value.toLowerCase();
  if (["prod", "production"].includes(lower)) {
    failures.push(
      "SAGITTARIUS_SIGNOFF_ENVIRONMENT must name staging/test/preflight evidence, not production",
    );
  }
  if (
    !lower.includes("staging") &&
    !lower.includes("test") &&
    !lower.includes("preflight")
  ) {
    failures.push(
      "SAGITTARIUS_SIGNOFF_ENVIRONMENT must name a staging/test/preflight environment",
    );
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
  if (isLocalhostHostname(url.hostname)) {
    failures.push(`${name} must not point at localhost`);
  }
  checkNoPlaceholderUrl(name, url);
}

function checkEvidenceUrl(name: string, value: string) {
  if (!value) return;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") {
      failures.push(`${name} must use https://`);
    }
    if (isLocalhostHostname(url.hostname)) {
      failures.push(`${name} must not point at localhost`);
    }
    checkNoPlaceholderUrl(name, url);
  } catch {
    failures.push(`${name} must be a valid evidence URL`);
  }
}

function checkAlertSink(value: string) {
  if (!value) return;
  if (value.length < 3 || /^tbd$/i.test(value)) {
    failures.push(
      "SAGITTARIUS_ALERT_SINK_NAME must name a real alert sink, not TBD",
    );
  }
}

function checkOwner(name: string, value: string) {
  if (!value) return;
  if (value.length < 3 || /^tbd$/i.test(value)) {
    failures.push(`${name} must be a real owner, not TBD`);
  }
}

function checkNoPlaceholderUrl(name: string, url: URL) {
  if (isPlaceholderHostname(url.hostname)) {
    failures.push(`${name} must not use placeholder domain: ${url.hostname}`);
  }
}

function isLocalhostHostname(hostname: string): boolean {
  const normalized = hostname
    .trim()
    .toLowerCase()
    .replace(/^\[(.*)\]$/, "$1");
  return ["localhost", "127.0.0.1", "::1"].includes(normalized);
}

function isPlaceholderHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return ["example.com", "example.net", "example.org", "example.test"].some(
    (placeholder) =>
      normalized === placeholder || normalized.endsWith(`.${placeholder}`),
  );
}

export {};
