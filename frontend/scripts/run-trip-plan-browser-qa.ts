import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join as joinPath, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Browser, type Page } from "playwright";
import type { Trip } from "../src/trip/types";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(scriptsDir, "..");
const storybookBaseUrl =
  process.env.SAGITTARIUS_TRIP_PLAN_QA_STORYBOOK_URL ??
  "http://127.0.0.1:6017";
const storybookPort =
  process.env.SAGITTARIUS_TRIP_PLAN_QA_STORYBOOK_PORT ?? "6017";
const evidenceDir =
  process.env.SAGITTARIUS_TRIP_PLAN_QA_EVIDENCE_DIR ??
  joinPath(tmpdir(), "sagittarius-trip-plan-browser-qa");
const storyUrl = `${trimTrailingSlash(storybookBaseUrl)}/iframe.html?id=sagittarius-app--itinerary&viewMode=story`;
const tripStorageKey = "sagittarius:trip-draft";
const browserQaTripPlanName = "Browser QA Rain Plan";

interface QaEvidence {
  checks: string[];
  environment: Record<string, string>;
  failures: string[];
  screenshots: string[];
  status: "running" | "passed" | "failed";
}

const evidence: QaEvidence = {
  checks: [],
  environment: {
    evidenceDir,
    storyUrl,
    storybookBaseUrl,
  },
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
        env: {
          ...process.env,
          NODE_OPTIONS: "--no-warnings",
          STORYBOOK_DISABLE_TELEMETRY: "1",
        },
        stdio: "pipe",
      });
      await waitForStorybook();
      evidence.checks.push(`Started Storybook at ${storybookBaseUrl}.`);
    } else {
      evidence.checks.push(`Used existing Storybook at ${storybookBaseUrl}.`);
    }

    browser = await chromium.launch({ headless: true });
    await runTripPlanQa(browser, "desktop-1280", { width: 1280, height: 900 });
    await runTripPlanQa(browser, "mobile-390", { width: 390, height: 844 });

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

async function runTripPlanQa(
  browser: Browser,
  name: string,
  viewport: { width: number; height: number },
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
  await page.waitForSelector(".workspace-shell", { timeout: 15_000 });
  await page.waitForSelector(".smart-table", { timeout: 15_000 });
  await screenshot(page, `${name}-initial-main.png`);

  const tripPlanSelector = page.getByLabel("Trip Plan");
  const initialMainTripPlanId = await tripPlanSelector.inputValue();
  if (!initialMainTripPlanId) throw new Error(`${name} did not start with a selected Main Plan.`);
  await assertTripPlanOptionLabels(page, [["Main"]]);

  await page.getByRole("button", { name: /New plan|เพิ่มแผน/i }).click();
  await page.getByLabel(/Plan name|ชื่อแผน/i).fill(browserQaTripPlanName);
  await page.getByRole("button", { name: /Create plan|สร้างแผน/i }).click();
  await waitForTripPlanOption(page, browserQaTripPlanName);
  const draftTripPlanId = await tripPlanSelector.inputValue();
  if (!draftTripPlanId || draftTripPlanId === initialMainTripPlanId) {
    throw new Error(`${name} did not select the newly created draft Trip Plan.`);
  }
  await assertTripPlanOptionLabels(page, [
    [browserQaTripPlanName, "Draft"],
  ]);
  await assertPersistedTrip(page, name, {
    activePlanVariantId: initialMainTripPlanId,
    mainTripPlanId: initialMainTripPlanId,
    selectedTripPlanId: draftTripPlanId,
    selectedPlanStatus: "draft",
  }, "creating and selecting a draft Trip Plan must not publish it");
  await screenshot(page, `${name}-selected-draft.png`);

  await page.getByRole("button", { name: /Set as main|ใช้เป็นแผนหลัก/i }).click();
  await page.waitForFunction(
    ({ key, id }) => {
      const raw = window.localStorage.getItem(key);
      if (!raw) return false;
      const trip = JSON.parse(raw);
      return trip.activePlanVariantId === id && trip.mainTripPlanId === id;
    },
    { key: tripStorageKey, id: draftTripPlanId },
    { timeout: 10_000 },
  );
  await assertPersistedTrip(page, name, {
    activePlanVariantId: draftTripPlanId,
    mainTripPlanId: draftTripPlanId,
    selectedTripPlanId: draftTripPlanId,
    selectedPlanStatus: "main",
    previousMainTripPlanId: initialMainTripPlanId,
    previousMainStatus: "backup",
  }, "explicit Set as main should publish the selected Trip Plan");
  await assertTripPlanOptionLabels(page, [
    [browserQaTripPlanName, "Main"],
    ["แผนหลัก", "Backup"],
  ]);
  await assertNoHorizontalPageOverflow(page, name);

  if (consoleErrors.length > 0) throw new Error(`${name} console errors: ${consoleErrors.join(" | ")}`);
  if (pageErrors.length > 0) throw new Error(`${name} page errors: ${pageErrors.join(" | ")}`);
  if (failedRequests.length > 0) throw new Error(`${name} failed requests: ${failedRequests.join(" | ")}`);
  await screenshot(page, `${name}-after-set-main.png`);
  await context.close();

  evidence.checks.push(
    `${name} created and selected a draft Trip Plan without publishing it, then used the explicit Set as main action to update activePlanVariantId/mainTripPlanId, option status labels, and page overflow/error checks.`,
  );
}

async function assertPersistedTrip(
  page: Page,
  name: string,
  expected: {
    activePlanVariantId: string;
    mainTripPlanId: string;
    previousMainStatus?: "backup";
    previousMainTripPlanId?: string;
    selectedTripPlanId: string;
    selectedPlanStatus: "draft" | "main";
  },
  reason: string,
) {
  const persisted = await page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as Trip;
  }, tripStorageKey);
  if (!persisted) throw new Error(`${name} ${reason}: persisted trip was missing.`);
  if (persisted.activePlanVariantId !== expected.activePlanVariantId) {
    throw new Error(`${name} ${reason}: activePlanVariantId was ${persisted.activePlanVariantId}.`);
  }
  if (persisted.mainTripPlanId !== expected.mainTripPlanId) {
    throw new Error(`${name} ${reason}: mainTripPlanId was ${persisted.mainTripPlanId}.`);
  }
  const selectedPlan = persisted.tripPlans?.find((plan) => plan.id === expected.selectedTripPlanId);
  if (selectedPlan?.status !== expected.selectedPlanStatus) {
    throw new Error(`${name} ${reason}: selected Trip Plan status was ${selectedPlan?.status}.`);
  }
  if (expected.previousMainTripPlanId && expected.previousMainStatus) {
    const previousMainPlan = persisted.tripPlans?.find((plan) => plan.id === expected.previousMainTripPlanId);
    if (previousMainPlan?.status !== expected.previousMainStatus) {
      throw new Error(`${name} ${reason}: previous Main Plan status was ${previousMainPlan?.status}.`);
    }
  }
}

async function assertTripPlanOptionLabels(page: Page, expectedGroups: string[][]) {
  const optionLabels = await page.getByLabel("Trip Plan").evaluate((select) =>
    Array.from((select as HTMLSelectElement).options).map((option) => option.textContent ?? ""),
  );
  for (const expectedParts of expectedGroups) {
    const found = optionLabels.some((label) =>
      expectedParts.every((part) => label.includes(part)),
    );
    if (!found) {
      throw new Error(
        `Trip Plan option labels ${JSON.stringify(optionLabels)} did not include ${JSON.stringify(expectedParts)}.`,
      );
    }
  }
}

async function waitForTripPlanOption(page: Page, expectedText: string) {
  await page.waitForFunction(
    (text) => {
      const tripPlanLabel = Array.from(document.querySelectorAll("label")).find((label) =>
        label.textContent?.includes("Trip Plan"),
      );
      const select = tripPlanLabel?.querySelector("select");
      return Array.from(select?.options ?? []).some((option) =>
        option.textContent?.includes(text),
      );
    },
    expectedText,
    { timeout: 10_000 },
  );
}

async function assertNoHorizontalPageOverflow(page: Page, name: string) {
  const result = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const viewportWidth = window.innerWidth;
    const offenders = Array.from(document.querySelectorAll<HTMLElement>("body *"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          className: element.className?.toString() ?? "",
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          tagName: element.tagName.toLowerCase(),
          text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 120) ?? "",
          width: Math.round(rect.width),
        };
      })
      .filter((entry) => entry.right > viewportWidth + 1 || entry.left < -1)
      .slice(0, 8);
    return {
      bodyScrollWidth: body.scrollWidth,
      docScrollWidth: doc.scrollWidth,
      innerWidth: window.innerWidth,
      offenders,
    };
  });
  if (
    result.docScrollWidth > result.innerWidth + 1 ||
    result.bodyScrollWidth > result.innerWidth + 1
  ) {
    throw new Error(`${name} has page-level horizontal overflow: ${JSON.stringify(result)}`);
  }
}

async function screenshot(page: Page, name: string) {
  const path = joinPath(evidenceDir, name);
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
