import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawn, spawnSync, type ChildProcessByStdio } from "node:child_process";
import type { Readable } from "node:stream";
import { setTimeout as delay } from "node:timers/promises";
import net from "node:net";
import { chromium, type Browser, type Page } from "playwright";

const databaseUrl = process.env.DATABASE_URL ?? "postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test";
const databaseName = databaseNameFromUrl(databaseUrl) ?? "sagittarius_test";
const backendManifest = "../backend/Cargo.toml";
const requestedApiBindAddress = process.env.SAGITTARIUS_EXPENSE_SMOKE_API_BIND_ADDR ?? "127.0.0.1:5194";
const frontendHost = process.env.SAGITTARIUS_EXPENSE_SMOKE_FRONTEND_HOST ?? "127.0.0.1";
const requestedFrontendPort = Number(process.env.SAGITTARIUS_EXPENSE_SMOKE_FRONTEND_PORT ?? "5195");
const tripRoute = "/trips/AY9OgFeIfeCkXIpVXRf8LQ/expenses";
const evidenceDir = process.env.SAGITTARIUS_EXPENSE_SMOKE_EVIDENCE_DIR ?? join(process.cwd(), "tmp", "expense-browser-smoke");
const desktopViewport = { width: 1440, height: 960 };
const mobileViewport = { width: 390, height: 844 };
type LoggedProcess = ChildProcessByStdio<null, Readable, Readable>;

interface ApiEvent {
  method?: string;
  status?: number;
  text?: string;
  type: string;
  url?: string;
}

interface SmokeResult {
  apiEvents: ApiEvent[];
  consoleErrors: string[];
  name: string;
  overflow: {
    clientWidth: number;
    offenders: Array<{ className: string; tagName: string; text: string }>;
    scrollWidth: number;
  };
  screenshots: string[];
  url: string;
}

async function main() {
  mkdirSync(evidenceDir, { recursive: true });
  const processes: LoggedProcess[] = [];
  let browser: Browser | null = null;
  const evidence: {
    apiBaseUrl?: string;
    databaseName: string;
    frontendBaseUrl?: string;
    results: SmokeResult[];
    status: "failed" | "passed";
  } = {
    databaseName,
    results: [],
    status: "failed",
  };

  try {
    const apiBindAddress = await findAvailableBindAddress(requestedApiBindAddress);
    const [frontendHostName] = splitHostPort(`${frontendHost}:${requestedFrontendPort}`);
    const frontendPort = await findAvailablePort(frontendHostName, requestedFrontendPort);
    const apiBaseUrl = `http://${apiBindAddress}`;
    const frontendBaseUrl = `http://${frontendHost}:${frontendPort}`;
    evidence.apiBaseUrl = apiBaseUrl;
    evidence.frontendBaseUrl = frontendBaseUrl;

    await run("cargo", ["run", "--manifest-path", backendManifest, "--bin", "seed_e2e"], {
      DATABASE_URL: databaseUrl,
      SAGITTARIUS_ALLOW_E2E_DB_RESET: "1",
      SAGITTARIUS_E2E_DATABASE_NAME: databaseName,
      SAGITTARIUS_ENV: "development",
    });

    const api = spawnLogged("api", "cargo", ["run", "--manifest-path", backendManifest, "--bin", "sagittarius-api"], {
      DATABASE_URL: databaseUrl,
      EMAIL_DELIVERY: "log",
      SAGITTARIUS_ALLOW_LOCAL_CORS: "1",
      SAGITTARIUS_BIND_ADDR: apiBindAddress,
      SAGITTARIUS_ENV: "development",
    });
    processes.push(api);
    await waitForHealth(`${apiBaseUrl}/api/v1/health`, "API");

    await run("bun", ["run", "build"], {
      NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL: apiBaseUrl,
      SAGITTARIUS_INTERNAL_API_BASE_URL: apiBaseUrl,
    });
    const frontend = spawnLogged("frontend", "bun", ["run", "start"], {
      HOSTNAME: frontendHost,
      NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL: apiBaseUrl,
      PORT: String(frontendPort),
      SAGITTARIUS_INTERNAL_API_BASE_URL: apiBaseUrl,
    });
    processes.push(frontend);
    await waitForHealth(`${frontendBaseUrl}/join/HK-SZ-2025`, "frontend");

    browser = await chromium.launch({ headless: true });
    evidence.results.push(await smokeWorkspace(browser, frontendBaseUrl, "desktop", desktopViewport));
    evidence.results.push(await smokeWorkspace(browser, frontendBaseUrl, "mobile", mobileViewport));
    evidence.status = "passed";
  } finally {
    await browser?.close();
    for (const child of [...processes].reverse()) {
      child.kill("SIGTERM");
    }
    writeFileSync(join(evidenceDir, "evidence.json"), JSON.stringify(evidence, null, 2));
  }
}

async function smokeWorkspace(
  browser: Browser,
  frontendBaseUrl: string,
  name: string,
  viewport: { width: number; height: number },
): Promise<SmokeResult> {
  const { page, apiEvents, assertNoErrors } = await newCheckedPage(browser, viewport);
  const screenshots: string[] = [];

  try {
    await page.goto(`${frontendBaseUrl}${tripRoute}`, { waitUntil: "networkidle" });
    await joinTripIfNeeded(page);
    await page.waitForURL(`**${tripRoute}`, { timeout: 20_000 });
    await expectText(page, "Trip spend");

    await page.reload({ waitUntil: "networkidle" });
    await expectText(page, "Trip spend");
    screenshots.push(await screenshot(page, `${name}-overview`));

    await openFinanceTab(page, "Personal account");
    await expectText(page, "Personal account");
    await expectText(page, "Display currency");
    await cycleStatementFilters(page);
    screenshots.push(await screenshot(page, `${name}-account-statement`));

    const downloadPromise = page.waitForEvent("download", { timeout: 10_000 });
    await page.getByRole("button", { name: /Export/i }).click();
    const download = await downloadPromise;
    if (!download.suggestedFilename().endsWith(".csv")) {
      throw new Error(`Expected CSV download, got ${download.suggestedFilename()}`);
    }

    await openFinanceTab(page, "Manage expenses");
    await expectText(page, "Dim sum breakfast");
    await openFirstExpenseActionMenu(page);
    screenshots.push(await screenshot(page, `${name}-spending-actions`));

    const overflow = await assertNoHorizontalPageOverflow(page);
    assertNoErrors();
    return {
      apiEvents,
      consoleErrors: [],
      name,
      overflow,
      screenshots,
      url: page.url(),
    };
  } catch (caught) {
    screenshots.push(await screenshot(page, `${name}-failure`).catch(() => ""));
    throw caught;
  } finally {
    await page.context().close();
  }
}

async function joinTripIfNeeded(page: Page) {
  if (!page.url().includes("/join")) return;
  if (await page.getByLabel("Trip ID").isVisible().catch(() => false)) {
    await page.getByLabel("Trip ID").fill("HK-SZ-2025");
  }
  await page.getByRole("textbox", { name: /Trip password/i }).fill("seed-trip-pass");
  await page.getByRole("button", { name: /Enter trip|เข้าห้อง|Join/i }).click();
  await page.getByRole("button", { name: /Aom/i }).waitFor({ state: "visible", timeout: 15_000 });
  await page.getByRole("button", { name: /Aom/i }).click();
  const password = page.getByLabel(/Set password for Aom|Aom.*password|ตั้งรหัสสำหรับ Aom/i);
  if (await password.isVisible().catch(() => false)) {
    await password.fill("expense-smoke-owner-pin");
    await page.getByRole("button", { name: /Confirm|Start|ยืนยัน|เริ่ม/i }).click();
  }
}

async function openFinanceTab(page: Page, name: "Manage expenses" | "Personal account") {
  await page.getByRole("tab", { name }).click();
  await page.getByRole("tab", { name, selected: true }).waitFor({ timeout: 5_000 });
}

async function cycleStatementFilters(page: Page) {
  for (const label of [/All/i, /Needs review/i, /Settlement recorded/i, /No payback needed/i]) {
    const filter = page.getByRole("button", { name: label }).first();
    if (await filter.isVisible().catch(() => false)) {
      await filter.click();
      await page.waitForTimeout(150);
    }
  }
}

async function openFirstExpenseActionMenu(page: Page) {
  const detailMore = page.getByRole("button", { name: /More expense actions/i }).first();
  if (await detailMore.isVisible().catch(() => false)) {
    await detailMore.click();
    await expectText(page, "Record refund");
    await expectText(page, "Create booking estimate");
    return;
  }
  await page.getByRole("button", { name: /Actions/i }).first().click();
}

async function screenshot(page: Page, name: string) {
  const path = join(evidenceDir, `${name}.png`);
  await page.screenshot({ fullPage: true, path });
  return path;
}

async function assertNoHorizontalPageOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const horizontalScrollAllowed = '[class*="overflow-x-auto"],[data-allow-horizontal-scroll="true"]';
    const offenders = Array.from(document.querySelectorAll<HTMLElement>("body *"))
      .filter((element) => {
        if (element.closest(horizontalScrollAllowed)) return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && (rect.left < -1 || rect.right > window.innerWidth + 1);
      })
      .slice(0, 8)
      .map((element) => ({
        className: String(element.className),
        tagName: element.tagName,
        text: (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 80),
      }));

    return {
      clientWidth: document.documentElement.clientWidth,
      offenders,
      scrollWidth: document.documentElement.scrollWidth,
    };
  });

  if (overflow.scrollWidth > overflow.clientWidth + 1 || overflow.offenders.length) {
    throw new Error(`Horizontal overflow detected: ${JSON.stringify(overflow, null, 2)}`);
  }
  return overflow;
}

async function newCheckedPage(
  browser: Browser,
  viewport: { width: number; height: number },
): Promise<{ apiEvents: ApiEvent[]; assertNoErrors: () => void; page: Page }> {
  const context = await browser.newContext({ acceptDownloads: true, viewport });
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  const apiEvents: ApiEvent[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("requestfailed", (request) => {
    if (!request.url().includes("/api/v1/")) return;
    const errorText = request.failure()?.errorText ?? "";
    apiEvents.push({
      method: request.method(),
      text: errorText,
      type: "requestfailed",
      url: request.url(),
    });
    if (errorText !== "net::ERR_ABORTED") {
      consoleErrors.push(`API request failed ${request.method()} ${request.url()} ${errorText}`);
    }
  });
  page.on("response", async (response) => {
    if (!response.url().includes("/api/v1/")) return;
    const status = response.status();
    apiEvents.push({
      method: response.request().method(),
      status,
      type: "response",
      url: response.url(),
    });
    if (status >= 400) {
      consoleErrors.push(
        `API ${status} ${response.request().method()} ${response.url()} ${await response.text().catch(() => "")}`,
      );
    }
  });

  return {
    apiEvents,
    assertNoErrors: () => {
      if (consoleErrors.length) throw new Error(`Browser/API errors:\n${consoleErrors.join("\n")}`);
    },
    page,
  };
}

async function expectText(page: Page, text: string) {
  await page.getByText(text, { exact: false }).filter({ visible: true }).first().waitFor({
    state: "visible",
    timeout: 10_000,
  });
}

async function waitForHealth(url: string, name: string) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      await delay(250);
    }
  }
  throw new Error(`Timed out waiting for ${name} at ${url}`);
}

function spawnLogged(name: string, command: string, args: string[], env: Record<string, string>): LoggedProcess {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => process.stdout.write(`[${name}] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[${name}] ${chunk}`));
  return child;
}

async function findAvailableBindAddress(bindAddress: string): Promise<string> {
  const [host, rawPort] = splitHostPort(bindAddress);
  const startPort = Number(rawPort);
  if (!Number.isInteger(startPort) || startPort <= 0) return bindAddress;
  const port = await findAvailablePort(host, startPort);
  return `${host}:${port}`;
}

async function findAvailablePort(host: string, startPort: number): Promise<number> {
  for (let port = startPort; port < startPort + 20; port += 1) {
    if (await isPortAvailable(host, port)) return port;
  }
  throw new Error(`No free port found near ${host}:${startPort}`);
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

function databaseNameFromUrl(url: string): string | null {
  const withoutQuery = url.split(/[?#]/)[0];
  const name = withoutQuery?.split("/").pop()?.trim();
  return name || null;
}

function run(command: string, args: string[], env: Record<string, string>) {
  const status = spawnSync(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    stdio: "inherit",
  });
  if (status.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited with ${status.status}`);
  }
}

await main();
