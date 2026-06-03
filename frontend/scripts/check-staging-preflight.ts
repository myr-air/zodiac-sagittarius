import { spawnSync } from "node:child_process";

const failures: string[] = [];
const databaseUrl = requiredEnv("DATABASE_URL");
const apiBaseUrl = requiredEnv("NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL");
const rustLog = requiredEnv("RUST_LOG");
const psql = process.env.PSQL ?? "psql";

checkDatabaseUrl(databaseUrl);
checkApiBaseUrl(apiBaseUrl);
checkRustLog(rustLog);
checkPsql(psql, databaseUrl);

if (failures.length > 0) {
  throw new Error(`Staging preflight failed:\n- ${failures.join("\n- ")}`);
}

console.log("staging preflight ok");

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

  const databaseName = url.pathname.replace(/^\//, "");
  const lowerUrl = value.toLowerCase();
  const allowProduction = process.env.SAGITTARIUS_ALLOW_PRODUCTION_PREFLIGHT === "1";
  if (!allowProduction && (databaseName === "sagittarius" || lowerUrl.includes("prod") || lowerUrl.includes("production"))) {
    failures.push("DATABASE_URL looks production-like; set SAGITTARIUS_ALLOW_PRODUCTION_PREFLIGHT=1 only for a deliberate production preflight");
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

  if (!["http:", "https:"].includes(url.protocol)) {
    failures.push("NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL must use http:// or https://");
  }
}

function checkRustLog(value: string) {
  if (!value) return;
  if (!value.includes("tower_http")) {
    failures.push("RUST_LOG must include tower_http so HTTP write traces reach logs");
  }
  if (!value.includes("sagittarius_api")) {
    failures.push("RUST_LOG must include sagittarius_api so API application logs reach logs");
  }
}

function checkPsql(command: string, url: string) {
  const [psqlCommand, ...psqlPrefixArgs] = splitCommand(command);
  if (!psqlCommand) {
    failures.push("PSQL command is required");
    return;
  }

  const version = spawnSync(psqlCommand, [...psqlPrefixArgs, "--version"], {
    encoding: "utf8",
  });
  if (version.status !== 0) {
    failures.push(`PSQL command is not runnable: ${command}`);
    return;
  }

  if (process.env.SAGITTARIUS_SKIP_PREFLIGHT_DB_CHECK === "1" || !url) return;

  const check = spawnSync(psqlCommand, [...psqlPrefixArgs, url, "-tAc", "select current_database()"], {
    encoding: "utf8",
  });
  if (check.status !== 0) {
    failures.push(`PSQL cannot connect to DATABASE_URL: ${check.stderr.trim() || "unknown error"}`);
  }
}

function splitCommand(command: string): string[] {
  return command.trim().split(/\s+/).filter(Boolean);
}
