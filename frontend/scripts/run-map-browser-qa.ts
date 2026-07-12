import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join as joinPath, resolve } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Browser, type Page } from "playwright";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(scriptsDir, "..");
const storybookBaseUrl =
  process.env.SAGITTARIUS_MAP_QA_STORYBOOK_URL ?? "http://127.0.0.1:6017";
const storybookPort =
  process.env.SAGITTARIUS_MAP_QA_STORYBOOK_PORT ?? "6017";
const evidenceDir =
  process.env.SAGITTARIUS_MAP_BROWSER_QA_EVIDENCE_DIR ??
  joinPath(tmpdir(), "sagittarius-map-browser-qa");

const desktopStoryUrl = `${trimTrailingSlash(storybookBaseUrl)}/iframe.html?id=sagittarius-app--desktop-1440-map&viewMode=story`;
const mobileStoryUrl = `${trimTrailingSlash(storybookBaseUrl)}/iframe.html?id=sagittarius-app--desktop-1024-map&viewMode=story`;

interface QaEvidence {
  checks: string[];
  environment: Record<string, string>;
  failures: string[];
  screenshots: string[];
  status: "running" | "passed" | "failed";
}

const evidence: QaEvidence = {
  checks: [],
  environment: { evidenceDir, storybookBaseUrl, desktopStoryUrl, mobileStoryUrl },
  failures: [],
  screenshots: [],
  status: "running",
};

async function main() {
  let storybook: ChildProcessWithoutNullStreams | null = null;
  let browser: Browser | null = null;

  await mkdir(evidenceDir, { recursive: true });

  try {
    if (!(await isReachable(storybookBaseUrl))) {
      storybook = spawn("bun", ["x", "storybook", "dev", "-p", storybookPort, "--ci"], {
        cwd: frontendRoot,
        env: { ...process.env, NODE_OPTIONS: "--no-warnings", STORYBOOK_DISABLE_TELEMETRY: "1" },
        stdio: "pipe",
      });
      await waitForStorybook();
      evidence.checks.push(`Started Storybook at ${storybookBaseUrl}.`);
    } else {
      evidence.checks.push(`Used existing Storybook at ${storybookBaseUrl}.`);
    }

    browser = await chromium.launch({ headless: true });

    await runMapQa(browser, "desktop-1440", { width: 1440, height: 960 }, desktopStoryUrl);
    await runMapQa(browser, "mobile-320", { width: 320, height: 667 }, desktopStoryUrl);

    evidence.status = "passed";
  } catch (error) {
    evidence.status = "failed";
    evidence.failures.push(error instanceof Error ? error.stack ?? error.message : String(error));
    throw error;
  } finally {
    await browser?.close();
    storybook?.kill("SIGTERM");
    await writeEvidence();
  }
}

async function runMapQa(
  browser: Browser,
  name: string,
  viewport: { width: number; height: number },
  storyUrl: string,
) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ""}`);
  });

  await page.goto(storyUrl, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".maplibregl-map, .route-map-canvas", { timeout: 20_000 });

  const mapContainerHeight = await page.evaluate(() => {
    const el = document.querySelector(".route-map-canvas") ?? document.querySelector(".maplibregl-map");
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.round(rect.height);
  });
  evidence.checks.push(`${name} map container height: ${mapContainerHeight}px`);

  if (name === "mobile-320" && mapContainerHeight < 280) {
    throw new Error(`${name}: map container height ${mapContainerHeight}px < 280px minimum`);
  }

  const canvasExists = await page.evaluate(() => !!document.querySelector(".maplibregl-canvas"));
  evidence.checks.push(`${name} MapLibre canvas element exists: ${canvasExists}`);

  const hasHorizontalOverflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > window.innerWidth + 1;
  });
  if (hasHorizontalOverflow) {
    throw new Error(`${name}: page has horizontal overflow`);
  }
  evidence.checks.push(`${name} no horizontal overflow`);

  if (consoleErrors.length > 0) {
    evidence.checks.push(`${name} console errors: ${consoleErrors.join(" | ")}`);
  } else {
    evidence.checks.push(`${name} no console errors`);
  }
  if (pageErrors.length > 0) {
    evidence.failures.push(`${name} page errors: ${pageErrors.join(" | ")}`);
  }
  if (failedRequests.length > 0) {
    evidence.checks.push(`${name} failed requests: ${failedRequests.join(" | ")}`);
  }

  await screenshot(page, `${name}.png`);
  await context.close();
}

async function screenshot(page: Page, filename: string) {
  const path = joinPath(evidenceDir, filename);
  await page.screenshot({ fullPage: true, path });
  evidence.screenshots.push(path);
}

async function isReachable(url: string) {
  try {
    const response = await fetch(url, { method: "GET" });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForStorybook() {
  const started = Date.now();
  while (Date.now() - started < 60_000) {
    if (await isReachable(storybookBaseUrl)) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Storybook did not become reachable at ${storybookBaseUrl}.`);
}

async function writeEvidence() {
  await writeFile(
    joinPath(evidenceDir, "evidence.json"),
    `${JSON.stringify(evidence, null, 2)}\n`,
  );
}

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

await main();
