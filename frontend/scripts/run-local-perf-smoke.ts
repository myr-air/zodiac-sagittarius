import { spawn, spawnSync } from "node:child_process";
import net from "node:net";
import { performance } from "node:perf_hooks";
import { setTimeout as delay } from "node:timers/promises";
import { createTripApiClient, TripApiError } from "../src/trip/api-client";

const databaseUrl = process.env.DATABASE_URL ?? "postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test";
const requestedBindAddress = process.env.SAGITTARIUS_PERF_SMOKE_BIND_ADDR ?? "127.0.0.1:5193";
const backendManifest = "../backend/Cargo.toml";
const requestCount = Number(process.env.SAGITTARIUS_PERF_SMOKE_REQUESTS ?? "48");
const concurrency = Number(process.env.SAGITTARIUS_PERF_SMOKE_CONCURRENCY ?? "8");
const maxP95Ms = Number(process.env.SAGITTARIUS_PERF_SMOKE_MAX_P95_MS ?? "1500");

async function main() {
  if (!Number.isInteger(requestCount) || requestCount < 8) {
    throw new Error("SAGITTARIUS_PERF_SMOKE_REQUESTS must be an integer >= 8");
  }
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > requestCount) {
    throw new Error("SAGITTARIUS_PERF_SMOKE_CONCURRENCY must be an integer between 1 and request count");
  }
  if (!Number.isFinite(maxP95Ms) || maxP95Ms <= 0) {
    throw new Error("SAGITTARIUS_PERF_SMOKE_MAX_P95_MS must be a positive number");
  }

  const bindAddress = await findAvailableBindAddress(requestedBindAddress);
  const apiBaseUrl = `http://${bindAddress}`;

  await run("cargo", ["run", "--manifest-path", backendManifest, "--bin", "seed_e2e"], {
    DATABASE_URL: databaseUrl,
  });

  const api = spawn("cargo", ["run", "--manifest-path", backendManifest, "--bin", "sagittarius-api"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      SAGITTARIUS_BIND_ADDR: bindAddress,
      RUST_LOG: process.env.RUST_LOG ?? "info,tower_http=info,sagittarius_api=info",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  api.stdout.setEncoding("utf8");
  api.stderr.setEncoding("utf8");
  api.stdout.on("data", (chunk) => process.stdout.write(`[perf-api] ${chunk}`));
  api.stderr.on("data", (chunk) => process.stderr.write(`[perf-api] ${chunk}`));

  try {
    await waitForHealth(apiBaseUrl);
    await runPerfSmoke(apiBaseUrl);
  } finally {
    api.kill("SIGTERM");
  }
}

async function runPerfSmoke(apiBaseUrl: string) {
  const client = createTripApiClient({ baseUrl: apiBaseUrl });
  const join = await client.joinTrip({ joinId: "HK-SZ-2025", password: "dim-sum-run" });
  const member = join.claimableMembers.find((candidate) => candidate.accessStatus === "active") ?? join.claimableMembers[0];
  if (!member) throw new Error("No claimable member returned by seeded trip");

  let session;
  try {
    session = await client.claimMember(join.trip.id, member.id, "1234", join.joinSessionToken);
  } catch (caught) {
    if (!(caught instanceof TripApiError) || caught.code !== "invalid_request") throw caught;
    session = await client.loginMember(join.trip.id, member.id, "1234", join.joinSessionToken);
  }

  const endpoints = [
    () => client.loadTrip(join.trip.id, session.sessionToken),
    () => client.listMembers(join.trip.id, session.sessionToken),
    () => client.getExpenseSummary(join.trip.id, session.sessionToken),
  ];
  for (const endpoint of endpoints) {
    await endpoint();
  }

  const durations: number[] = [];
  const failures: string[] = [];
  const startedAt = performance.now();

  let nextIndex = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (nextIndex < requestCount) {
        const index = nextIndex;
        nextIndex += 1;
        const started = performance.now();
        try {
          await endpoints[index % endpoints.length]();
          durations.push(performance.now() - started);
        } catch (caught) {
          failures.push(caught instanceof Error ? caught.message : String(caught));
        }
      }
    }),
  );

  if (failures.length) {
    throw new Error(`Perf smoke had ${failures.length} failed requests:\n${failures.slice(0, 5).join("\n")}`);
  }

  durations.sort((left, right) => left - right);
  const p95 = percentile(durations, 0.95);
  const total = performance.now() - startedAt;
  process.stdout.write(
    `perf smoke ok: requests=${requestCount} concurrency=${concurrency} totalMs=${Math.round(total)} p95Ms=${Math.round(p95)} maxP95Ms=${maxP95Ms}\n`,
  );

  if (p95 > maxP95Ms) {
    throw new Error(`Perf smoke p95 ${Math.round(p95)}ms exceeded ${maxP95Ms}ms`);
  }
}

function percentile(values: number[], ratio: number): number {
  if (!values.length) return 0;
  const index = Math.min(values.length - 1, Math.ceil(values.length * ratio) - 1);
  return values[index];
}

async function findAvailableBindAddress(bindAddress: string): Promise<string> {
  const [host, rawPort] = splitHostPort(bindAddress);
  const startPort = Number(rawPort);
  if (!Number.isInteger(startPort) || startPort <= 0) return bindAddress;

  for (let port = startPort; port < startPort + 20; port += 1) {
    if (await isPortAvailable(host, port)) return `${host}:${port}`;
  }
  throw new Error(`No free port found near ${bindAddress}`);
}

function splitHostPort(bindAddress: string): [string, string] {
  const separator = bindAddress.lastIndexOf(":");
  if (separator <= 0) return [bindAddress, ""];
  return [bindAddress.slice(0, separator), bindAddress.slice(separator + 1)];
}

function isPortAvailable(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

async function waitForHealth(baseUrl: string) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/v1/health`);
      if (response.ok) return;
    } catch {
      await delay(250);
    }
  }

  throw new Error(`Timed out waiting for ${baseUrl}/api/v1/health`);
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
