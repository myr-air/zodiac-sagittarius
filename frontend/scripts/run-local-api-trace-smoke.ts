import { spawn, spawnSync } from "node:child_process";
import net from "node:net";
import { setTimeout as delay } from "node:timers/promises";

const databaseUrl = process.env.DATABASE_URL ?? "postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test";
const requestedBindAddress = process.env.SAGITTARIUS_TRACE_SMOKE_BIND_ADDR ?? "127.0.0.1:5192";
const backendManifest = "../backend/Cargo.toml";

async function main() {
  const bindAddress = await findAvailableBindAddress(requestedBindAddress);
  const apiBaseUrl = `http://${bindAddress}`;
  const logs: string[] = [];

  await run("cargo", ["run", "--manifest-path", backendManifest, "--bin", "seed_e2e"], {
    DATABASE_URL: databaseUrl,
  });

  const api = spawn("cargo", ["run", "--manifest-path", backendManifest, "--bin", "sagittarius-api"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      RUST_LOG: "info,tower_http=info,sagittarius_api=info",
      SAGITTARIUS_BIND_ADDR: bindAddress,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  api.stdout.setEncoding("utf8");
  api.stderr.setEncoding("utf8");
  api.stdout.on("data", (chunk) => {
    logs.push(chunk);
    process.stdout.write(chunk);
  });
  api.stderr.on("data", (chunk) => {
    logs.push(chunk);
    process.stderr.write(chunk);
  });

  try {
    await waitForHealth(apiBaseUrl);
    const response = await fetch(`${apiBaseUrl}/api/v1/trip-join-sessions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ joinCode: "HK-SZ-2025", tripPassword: "dim-sum-run" }),
    });
    if (!response.ok) {
      throw new Error(`join session smoke request returned ${response.status}: ${await response.text()}`);
    }

    await waitForTraceLogs(logs, [
      "method=POST",
      "uri=/api/v1/trip-join-sessions",
      "started processing request",
      "finished processing request",
      "status=200",
    ]);
  } finally {
    api.kill("SIGTERM");
  }
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

async function waitForTraceLogs(logs: string[], requiredSnippets: string[]) {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const output = logs.join("");
    if (requiredSnippets.every((snippet) => output.includes(snippet))) return;
    await delay(100);
  }

  throw new Error(`Timed out waiting for HTTP trace log snippets: ${requiredSnippets.join(", ")}`);
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
