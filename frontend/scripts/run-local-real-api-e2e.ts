import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const databaseUrl = process.env.DATABASE_URL ?? "postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test";
const bindAddress = process.env.SAGITTARIUS_BIND_ADDR ?? "127.0.0.1:5181";
const apiBaseUrl = `http://${bindAddress}`;
const backendManifest = "../backend/Cargo.toml";

async function main() {
  await run("cargo", ["run", "--manifest-path", backendManifest, "--bin", "seed_e2e"], {
    DATABASE_URL: databaseUrl,
  });

  const api = spawn("cargo", ["run", "--manifest-path", backendManifest, "--bin", "sagittarius-api"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      SAGITTARIUS_BIND_ADDR: bindAddress,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  api.stdout.setEncoding("utf8");
  api.stderr.setEncoding("utf8");
  api.stdout.on("data", (chunk) => process.stdout.write(chunk));
  api.stderr.on("data", (chunk) => process.stderr.write(chunk));

  try {
    await waitForHealth(apiBaseUrl);
    await run("bun", ["run", "test:e2e:real"], {
      SAGITTARIUS_E2E_API_BASE_URL: apiBaseUrl,
      SAGITTARIUS_E2E_JOIN_ID: "HK-SZ-2025",
      SAGITTARIUS_E2E_TRIP_PASSWORD: "dim-sum-run",
      SAGITTARIUS_E2E_PARTICIPANT_PASSWORD: "1234",
    });
  } finally {
    api.kill("SIGTERM");
  }
}

async function waitForHealth(baseUrl: string) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/v1/health`);
      if (response.ok) return;
    } catch {
      await delay(250);
    }
  }

  throw new Error(`Timed out waiting for ${baseUrl}/v1/health`);
}

async function run(command: string, args: string[], env: Record<string, string>) {
  const status = spawnSync(command, args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...env,
    },
    stdio: "inherit",
  });

  if (status.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited with ${status.status}`);
  }
}

await main();
