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
  process.env.SAGITTARIUS_ITINERARY_ENTRY_QA_STORYBOOK_URL ??
  "http://127.0.0.1:6018";
const storybookPort =
  process.env.SAGITTARIUS_ITINERARY_ENTRY_QA_STORYBOOK_PORT ?? "6018";
const evidenceDir =
  process.env.SAGITTARIUS_ITINERARY_ENTRY_QA_EVIDENCE_DIR ??
  joinPath(tmpdir(), "sagittarius-itinerary-entry-browser-qa");
const storyUrl = `${trimTrailingSlash(storybookBaseUrl)}/iframe.html?id=sagittarius-app--itinerary&viewMode=story&preserveStoryStorage=1`;
const tripStorageKey = "sagittarius:trip-draft";
const targetTripPlanId = "plan-rain";

const qaRows = {
  block: "Browser QA parent block HKG to Central",
  subItem: "Browser QA sub-item buy Octopus",
  flexible: "Browser QA flexible checklist",
  openEnded: "Browser QA open-ended market",
  expense: "Browser QA actual expense",
};

interface QaEvidence {
  checks: string[];
  environment: Record<string, string>;
  failures: string[];
  observations: Record<string, string[]>;
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
  observations: {},
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
    await runItineraryEntryQa(browser, "desktop-1280", { width: 1280, height: 900 });
    await runItineraryEntryQa(browser, "mobile-390", { width: 390, height: 844 });

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

async function runItineraryEntryQa(
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
  await selectTripPlan(page, targetTripPlanId);
  await screenshot(page, `${name}-initial-rain-plan.png`);

  await addJourneyBlock(page);
  await assertContextRailClosed(page, `${name} after parent block save`);
  await addSubItem(page);
  await assertContextRailClosed(page, `${name} after sub-item save`);
  await addFlexibleTask(page);
  await assertContextRailClosed(page, `${name} after flexible row save`);
  await addOpenEndedPlace(page);
  await assertContextRailClosed(page, `${name} after open-ended row save`);

  const blockId = await itemIdForActivity(page, qaRows.block);
  await createBookingDraft(page);
  await createActualExpense(page);
  await verifyPersistedRecords(page, name, blockId);
  await verifyLinkedPages(page, name);
  await assertNoHorizontalPageOverflow(page, name);
  await screenshot(page, `${name}-after-linked-records.png`);

  await page.goto(`${storyUrl}&tripPlanId=${encodeURIComponent(targetTripPlanId)}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector(".smart-table", { timeout: 15_000 });
  await ensureSelectedTripPlan(page, targetTripPlanId);
  await verifyPersistedRecords(page, `${name} after reload`, blockId);
  await screenshot(page, `${name}-after-reload-before-visible-check.png`);
  await assertVisibleRows(page, name);
  await assertNoHorizontalPageOverflow(page, `${name} after reload`);
  await screenshot(page, `${name}-after-reload.png`);

  evidence.observations[name] = [
    `console errors: ${consoleErrors.length}`,
    `page errors: ${pageErrors.length}`,
    `failed requests: ${failedRequests.length}`,
  ];
  if (consoleErrors.length > 0) throw new Error(`${name} console errors: ${consoleErrors.join(" | ")}`);
  if (pageErrors.length > 0) throw new Error(`${name} page errors: ${pageErrors.join(" | ")}`);
  if (failedRequests.length > 0) throw new Error(`${name} failed requests: ${failedRequests.join(" | ")}`);
  await context.close();

  evidence.checks.push(
    `${name} manually entered a parent journey block, sub-item, flexible/no-time row, open-ended place row, booking draft, and actual expense in Trip Plan ${targetTripPlanId}; verified itinerary rows, details rail, bookings page, expenses page, reload persistence, console/page/network observations, and horizontal overflow.`,
  );
}

async function addJourneyBlock(page: Page) {
  const dialog = await openAddDialog(page);
  await dialog.locator("#stop-activity-type").selectOption("transportation");
  await dialog.locator("#stop-activity").fill(qaRows.block);
  await dialog.locator("#stop-origin").fill("Hong Kong International Airport");
  await dialog.locator("#stop-destination").fill("Central Station");
  await dialog.locator("#stop-mode").fill("Airport Express");
  await dialog.locator("#stop-start-time").fill("09:15");
  await dialog.locator("#stop-end-time").fill("10:05");
  await dialog.locator("#stop-ticket-ref").fill("Airport Express QR");
  await dialog.locator("#stop-cost-note").fill("HK$115");
  await saveDialog(dialog);
  await page.getByRole("row", { name: new RegExp(escapeRegex(qaRows.block), "i") }).waitFor();
}

async function addSubItem(page: Page) {
  const blockRow = page.getByRole("row", { name: new RegExp(escapeRegex(qaRows.block), "i") });
  await blockRow
    .getByRole("button", {
      name: new RegExp(`sub-activity.*${escapeRegex(qaRows.block)}|ใต้ ${escapeRegex(qaRows.block)}`, "i"),
    })
    .first()
    .click();
  const dialog = page.getByRole("dialog", { name: /Add activity|เพิ่มกิจกรรม/i });
  await dialog.locator("#stop-activity").fill(qaRows.subItem);
  await dialog.locator("#stop-place").fill("Airport service counter");
  await saveDialog(dialog);
  await page.getByRole("row", { name: new RegExp(escapeRegex(qaRows.subItem), "i") }).waitFor();
}

async function addFlexibleTask(page: Page) {
  const dialog = await openAddDialog(page);
  await dialog.locator("#stop-activity-type").selectOption("task");
  await dialog.locator("#stop-activity").fill(qaRows.flexible);
  await dialog.locator("#stop-place").fill("Shared planning sheet");
  await dialog.locator("#stop-detail").fill("Confirm flexible shopping window with the group");
  await saveDialog(dialog);
  await page.getByRole("row", { name: new RegExp(escapeRegex(qaRows.flexible), "i") }).waitFor();
}

async function addOpenEndedPlace(page: Page) {
  const dialog = await openAddDialog(page);
  await dialog.locator("#stop-activity").fill(qaRows.openEnded);
  await dialog.locator("#stop-place").fill("Mong Kok Market");
  await dialog.locator("#stop-start-time").fill("14:20");
  await dialog.locator("#stop-end-time").fill("");
  await saveDialog(dialog);
  await page.getByRole("row", { name: new RegExp(escapeRegex(qaRows.openEnded), "i") }).waitFor();
}

async function createBookingDraft(page: Page) {
  const blockRow = page.getByRole("row", { name: new RegExp(escapeRegex(qaRows.block), "i") });
  await blockRow.getByRole("button", { name: new RegExp(`Add booking draft for ${escapeRegex(qaRows.block)}`, "i") }).click();
  await page
    .getByRole("menu", { name: new RegExp(`Booking draft templates for ${escapeRegex(qaRows.block)}`, "i") })
    .getByRole("menuitem", { name: "Flight" })
    .click();
  await page.waitForFunction(
    ({ key, title }) => {
      const raw = window.localStorage.getItem(key);
      if (!raw) return false;
      const trip = JSON.parse(raw);
      return trip.bookingDocs?.some((booking: { title?: string }) => booking.title === title);
    },
    { key: tripStorageKey, title: `${qaRows.block} flight ticket draft` },
    { timeout: 10_000 },
  );
}

async function createActualExpense(page: Page) {
  await page.getByRole("button", { name: new RegExp(`Select .*${escapeRegex(qaRows.block)}|เลือกจุด ${escapeRegex(qaRows.block)}`, "i") }).click();
  await page.locator("aside[data-state='open']").waitFor({ timeout: 10_000 });
  const expenseModule = page.locator(".expense-module");
  await expenseModule.locator("input").nth(0).fill(qaRows.expense);
  await expenseModule.locator("input").nth(1).fill("88");
  await expenseModule.locator("select").nth(1).selectOption("transport");
  await expenseModule.getByRole("button", { name: /Add\/edit actual expense|เพิ่ม\/แก้ไขค่าใช้จ่ายจริง/i }).click();
  await page.waitForFunction(
    ({ key, title }) => {
      const raw = window.localStorage.getItem(key);
      if (!raw) return false;
      const trip = JSON.parse(raw);
      return trip.expenses?.some((expense: { title?: string }) => expense.title === title);
    },
    { key: tripStorageKey, title: qaRows.expense },
    { timeout: 10_000 },
  );
  const railText = await page.locator("aside[data-state='open']").innerText();
  assertContains(railText, qaRows.expense, "details rail actual expense");
}

async function verifyLinkedPages(page: Page, name: string) {
  await page.getByRole("link", { name: /Bookings|การจอง/i }).click();
  await expectBodyContains(page, `${qaRows.block} flight ticket draft`, `${name} bookings page`);
  await page.getByRole("link", { name: /Expenses|ค่าใช้จ่าย/i }).click();
  await expectBodyContains(page, qaRows.expense, `${name} expenses page`);
  await expectBodyContains(page, qaRows.block, `${name} expenses linked stop`);
  await page.getByRole("link", { name: /Itinerary|แผนการเดินทาง/i }).click();
  await page.waitForSelector(".smart-table", { timeout: 10_000 });
}

async function verifyPersistedRecords(page: Page, name: string, blockId: string) {
  const persisted = await page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, tripStorageKey) as Trip | null;
  if (!persisted) throw new Error(`${name} missing persisted trip draft.`);

  const block = persisted.itineraryItems.find((item) => item.activity === qaRows.block);
  const subItem = persisted.itineraryItems.find((item) => item.activity === qaRows.subItem);
  const flexible = persisted.itineraryItems.find((item) => item.activity === qaRows.flexible);
  const openEnded = persisted.itineraryItems.find((item) => item.activity === qaRows.openEnded);
  const booking = persisted.bookingDocs?.find((candidate) => candidate.title === `${qaRows.block} flight ticket draft`);
  const expense = persisted.expenses?.find((candidate) => candidate.title === qaRows.expense);

  expectObject(block, {
    activity: qaRows.block,
    activityType: "travel",
    isPlanBlock: true,
    itemKind: "travel",
    planVariantId: targetTripPlanId,
    startTime: "09:15",
    endTime: "10:05",
  }, `${name} parent block`);
  expectObject(subItem, {
    activity: qaRows.subItem,
    parentItemId: blockId,
    planVariantId: targetTripPlanId,
  }, `${name} sub-item`);
  expectObject(flexible, {
    activity: qaRows.flexible,
    timeMode: "flexible",
    startTime: "",
    endTime: null,
    endOffsetDays: 0,
    durationMinutes: null,
    planVariantId: targetTripPlanId,
  }, `${name} flexible row`);
  expectObject(openEnded, {
    activity: qaRows.openEnded,
    endTime: null,
    durationMinutes: null,
    planVariantId: targetTripPlanId,
  }, `${name} open-ended row`);
  if (!openEnded?.mapLink?.includes("maps.google.com")) {
    throw new Error(`${name} open-ended map link was ${JSON.stringify(openEnded?.mapLink)}.`);
  }
  expectObject(booking, {
    tripPlanId: targetTripPlanId,
    title: `${qaRows.block} flight ticket draft`,
  }, `${name} booking draft`);
  expectArrayContains(booking?.relatedItineraryItemIds, blockId, `${name} booking itinerary link`);
  expectObject(expense, {
    amount: 88,
    category: "transport",
    itineraryItemId: blockId,
    title: qaRows.expense,
    tripPlanId: targetTripPlanId,
  }, `${name} actual expense`);
}

async function assertVisibleRows(page: Page, name: string) {
  const blockRow = page.getByRole("row", { name: new RegExp(escapeRegex(qaRows.block), "i") });
  await blockRow.waitFor({ timeout: 10_000 });
  await page.getByRole("row", { name: new RegExp(escapeRegex(qaRows.subItem), "i") }).waitFor({ timeout: 10_000 });
  await page.getByRole("row", { name: new RegExp(escapeRegex(qaRows.flexible), "i") }).waitFor({ timeout: 10_000 });
  await page.getByRole("row", { name: new RegExp(escapeRegex(qaRows.openEnded), "i") }).waitFor({ timeout: 10_000 });
  const blockText = await blockRow.innerText();
  assertContains(blockText, "1 booking", `${name} visible booking count`);
  assertContains(blockText, "1 expense", `${name} visible expense count`);
}

async function openAddDialog(page: Page) {
  await page.getByRole("button", { name: /Add stop or activity|Add place \/ activity|เพิ่มสถานที่ \/ กิจกรรม/i }).first().click();
  const dialog = page.getByRole("dialog", { name: /Add activity|เพิ่มกิจกรรม/i });
  await dialog.waitFor({ state: "visible", timeout: 10_000 });
  return dialog;
}

async function saveDialog(dialog: ReturnType<Page["getByRole"]>) {
  await dialog.getByRole("button", { name: /Save activity|บันทึกกิจกรรม/i }).click();
  await dialog.waitFor({ state: "hidden", timeout: 10_000 });
}

async function selectTripPlan(page: Page, tripPlanId: string) {
  const selector = page.getByLabel(/Trip Plan|แผน/i);
  await selector.selectOption(tripPlanId);
  await ensureSelectedTripPlan(page, tripPlanId);
}

async function ensureSelectedTripPlan(page: Page, tripPlanId: string) {
  const selector = page.getByLabel(/Trip Plan|แผน/i);
  if ((await selector.inputValue()) !== tripPlanId) {
    await selector.selectOption(tripPlanId);
  }
  await page.waitForFunction(
    ({ id }) => {
      const select = Array.from(document.querySelectorAll("select")).find((candidate) =>
        Array.from(candidate.options).some((option) => option.value === id),
      );
      return select?.value === id;
    },
    { id: tripPlanId },
    { timeout: 10_000 },
  );
}

async function itemIdForActivity(page: Page, activity: string): Promise<string> {
  const itemId = await page.evaluate(
    ({ key, activity }) => {
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;
      const trip = JSON.parse(raw) as Trip;
      return trip.itineraryItems.find((item) => item.activity === activity)?.id ?? null;
    },
    { key: tripStorageKey, activity },
  );
  if (!itemId) throw new Error(`Could not find item id for ${activity}.`);
  return itemId;
}

async function assertContextRailClosed(page: Page, label: string) {
  const openRails = await page.locator("aside[data-state='open']").count();
  if (openRails > 0) throw new Error(`${label}: context rail stayed open.`);
}

async function expectBodyContains(page: Page, expected: string, label: string) {
  try {
    await page.waitForFunction(
      (value) => document.body?.innerText.includes(value),
      expected,
      { timeout: 10_000 },
    );
  } catch (error) {
    const bodyText = await page.locator("body").innerText();
    throw new Error(
      `${label} missing ${JSON.stringify(expected)}. Body started with: ${JSON.stringify(bodyText.slice(0, 800))}`,
      { cause: error },
    );
  }
  const bodyText = await page.locator("body").innerText();
  assertContains(bodyText, expected, label);
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

function assertContains(value: string, expected: string, label: string) {
  if (!value.includes(expected)) {
    throw new Error(`${label} missing ${JSON.stringify(expected)}.`);
  }
}

function expectObject(
  actual: null | object | undefined,
  expected: Record<string, unknown>,
  label: string,
) {
  if (!actual) throw new Error(`${label} missing.`);
  const actualRecord = actual as Record<string, unknown>;
  for (const [key, value] of Object.entries(expected)) {
    if (actualRecord[key] !== value) {
      throw new Error(`${label} expected ${key}=${JSON.stringify(value)}, got ${JSON.stringify(actualRecord[key])}.`);
    }
  }
}

function expectArrayContains(actual: unknown, expected: string, label: string) {
  if (!Array.isArray(actual) || !actual.includes(expected)) {
    throw new Error(`${label} missing ${JSON.stringify(expected)}.`);
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

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

await main();
