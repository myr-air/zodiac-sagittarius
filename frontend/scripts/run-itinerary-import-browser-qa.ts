import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join as joinPath, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Browser, type Page } from "playwright";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(scriptsDir, "..");
const storybookBaseUrl =
  process.env.SAGITTARIUS_ITINERARY_IMPORT_QA_STORYBOOK_URL ??
  "http://127.0.0.1:6016";
const storybookPort =
  process.env.SAGITTARIUS_ITINERARY_IMPORT_QA_STORYBOOK_PORT ?? "6016";
const evidenceDir =
  process.env.SAGITTARIUS_ITINERARY_IMPORT_QA_EVIDENCE_DIR ??
  joinPath(tmpdir(), "sagittarius-itinerary-import-browser-qa");
const storyUrl = `${trimTrailingSlash(storybookBaseUrl)}/iframe.html?id=sagittarius-app--itinerary&viewMode=story`;
const tripStorageKey = "sagittarius:trip-draft";

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

const importDocument = {
  schema: "joii.itinerary.export",
  version: 1,
  exportedAt: "2026-06-12T13:50:00.000Z",
  trip: {
    id: "trip-seed",
    name: "Browser QA Trip",
    destinationLabel: "Hong Kong",
    startDate: "2026-06-18",
    endDate: "2026-06-23",
    activePlanVariantId: "plan-main",
    mainTripPlanId: "plan-main",
  },
  items: [
    {
      id: "browser-flight-block",
      itemKind: "travel",
      timeMode: "scheduled",
      isPlanBlock: true,
      status: "confirmed",
      priority: "must",
      day: "2026-06-19",
      sortOrder: 100,
      startTime: "23:00",
      endTime: "02:00",
      endOffsetDays: 1,
      activity: "Browser QA flight block",
      activityType: "travel",
      place: "BKK",
      linkLabel: "Map",
      mapLink: "",
      durationMinutes: 180,
      transportation: "Flight",
      details: { bookingRef: "QA349" },
      note: "Browser QA import block",
    },
    {
      id: "browser-checkin",
      parentItemId: "browser-flight-block",
      itemKind: "preparation",
      timeMode: "flexible",
      isPlanBlock: false,
      status: "planned",
      priority: "high",
      day: "2026-06-19",
      sortOrder: 110,
      startTime: "",
      endTime: null,
      endOffsetDays: 0,
      activity: "Browser QA check-in",
      activityType: "travel",
      place: "Hotel lobby",
      linkLabel: "Map",
      mapLink: "",
      durationMinutes: null,
      transportation: "",
      details: {},
      note: "Browser QA sub activity",
    },
  ],
  records: {
    expenses: [
      {
        id: "browser-expense",
        tripId: "trip-seed",
        tripPlanId: "plan-main",
        title: "Browser QA receipt",
        amount: 120,
        paidBy: "member-aom",
        splits: { "member-aom": 120 },
        category: "tickets",
        itineraryItemId: "browser-flight-block",
      },
    ],
    bookingDocs: [
      {
        id: "browser-booking",
        tripId: "trip-seed",
        tripPlanId: "plan-main",
        type: "flight",
        title: "Browser QA booking",
        status: "confirmed",
        visibility: "shared",
        ownerMemberId: null,
        providerName: "Browser Airways",
        confirmationCode: "BQA-349",
        startsAt: "2026-06-19T23:00:00+07:00",
        endsAt: "2026-06-20T02:00:00+08:00",
        timezone: "Asia/Bangkok",
        priceAmount: 120,
        currency: "HKD",
        travelerIds: ["member-aom"],
        externalLinks: [
          {
            id: "browser-booking-link",
            label: "Booking voucher",
            url: "https://example.test/browser-booking",
            provider: "Browser QA",
            accessNote: "QA fixture",
          },
        ],
        relatedItineraryItemIds: ["browser-flight-block"],
        relatedTaskIds: ["browser-task"],
        relatedExpenseIds: ["browser-expense"],
        noteIds: ["browser-note"],
        notes: "Browser QA booking document",
        createdBy: "member-aom",
        updatedAt: "2026-06-12T13:50:00.000Z",
        version: 1,
      },
    ],
    stopNotes: [
      {
        id: "browser-note",
        tripId: "trip-seed",
        tripPlanId: "plan-main",
        itemId: "browser-flight-block",
        authorId: "member-aom",
        body: "Browser QA note",
        createdAt: "2026-06-12T13:50:00.000Z",
        version: 1,
      },
    ],
    tasks: [
      {
        id: "browser-task",
        tripPlanId: "plan-main",
        title: "Browser QA task",
        status: "open",
        visibility: "shared",
        kind: "booking",
        createdBy: "member-aom",
        relatedItemId: "browser-flight-block",
        version: 1,
      },
    ],
  },
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
    await runImportQa(browser, "desktop-1280", { width: 1280, height: 900 });
    await runImportQa(browser, "mobile-390", { width: 390, height: 844 });

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

async function runImportQa(
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
  await page.evaluate((key) => window.localStorage.removeItem(key), tripStorageKey);
  await screenshot(page, `${name}-initial.png`);

  await page.locator('input[type="file"]').first().setInputFiles({
    name: "browser-qa-itinerary.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(importDocument)),
  });
  const dialog = page.getByRole("dialog", {
    name: /ตั้งค่า import itinerary|import itinerary/i,
  });
  await dialog.waitFor({ state: "visible", timeout: 10_000 });
  const dialogText = (await dialog.textContent()) ?? "";
  if (!dialogText.includes("Records detected: 1 expenses, 1 bookings, 1 notes, 1 tasks")) {
    throw new Error(`Import dialog did not summarize imported records for ${name}.`);
  }
  await dialog.getByRole("button", { name: /import itinerary/i }).click();
  await page.waitForFunction(
    () => document.body?.innerText.includes("Browser QA flight block"),
    null,
    { timeout: 10_000 },
  );
  const bodyText = await page.locator("body").innerText();
  assertContains(bodyText, "Browser QA flight block", `${name} visible imported block`);
  assertContains(bodyText, "23:00-02:00", `${name} visible cross-day time`);
  assertContains(bodyText, "⁺¹", `${name} visible +1 offset`);
  assertContains(bodyText, "1 sub", `${name} visible sub-activity count`);
  assertContains(bodyText, "1 booking", `${name} visible booking commitment`);
  assertContains(bodyText, "1 expense", `${name} visible expense commitment`);
  assertContains(bodyText, "1 task", `${name} visible task commitment`);
  assertContains(bodyText, "1 note", `${name} visible note commitment`);

  const persisted = await page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const trip = JSON.parse(raw);
    return {
      itemCount: trip.itineraryItems?.filter((item: { activity?: string }) =>
        String(item.activity).startsWith("Browser QA"),
      ).length ?? 0,
      block: trip.itineraryItems?.find((item: { activity?: string }) =>
        item.activity === "Browser QA flight block",
      ) ?? null,
      sub: trip.itineraryItems?.find((item: { activity?: string }) =>
        item.activity === "Browser QA check-in",
      ) ?? null,
      expense: trip.expenses?.find((expense: { title?: string }) =>
        expense.title === "Browser QA receipt",
      ) ?? null,
      booking: trip.bookingDocs?.find((booking: { title?: string }) =>
        booking.title === "Browser QA booking",
      ) ?? null,
      note: trip.stopNotes?.find((note: { body?: string }) =>
        note.body === "Browser QA note",
      ) ?? null,
      task: trip.tasks?.find?.((task: { title?: string }) =>
        task.title === "Browser QA task",
      ) ?? null,
    };
  }, tripStorageKey) as {
    block: null | Record<string, unknown>;
    booking: null | Record<string, unknown>;
    expense: null | Record<string, unknown>;
    itemCount: number;
    note: null | Record<string, unknown>;
    sub: null | Record<string, unknown>;
    task: null | Record<string, unknown>;
  } | null;

  if (!persisted) throw new Error(`${name} did not persist an imported trip draft.`);
  if (persisted.itemCount !== 2) throw new Error(`${name} expected 2 imported items, got ${persisted.itemCount}.`);
  expectObject(persisted.block, {
    activity: "Browser QA flight block",
    endOffsetDays: 1,
    endTime: "02:00",
    isPlanBlock: true,
    itemKind: "travel",
    status: "confirmed",
  }, `${name} activity block`);
  expectObject(persisted.sub, {
    activity: "Browser QA check-in",
    parentItemId: "browser-flight-block",
    timeMode: "flexible",
  }, `${name} sub-activity`);
  expectObject(persisted.expense, {
    itineraryItemId: "browser-flight-block",
    title: "Browser QA receipt",
    tripPlanId: "plan-main",
  }, `${name} expense`);
  expectObject(persisted.booking, {
    title: "Browser QA booking",
    tripPlanId: "plan-main",
  }, `${name} booking`);
  expectArrayContains(
    persisted.booking?.relatedItineraryItemIds,
    "browser-flight-block",
    `${name} booking itinerary link`,
  );
  expectObject(persisted.note, {
    body: "Browser QA note",
    itemId: "browser-flight-block",
    tripPlanId: "plan-main",
  }, `${name} note`);
  expectObject(persisted.task, {
    relatedItemId: "browser-flight-block",
    title: "Browser QA task",
    tripPlanId: "plan-main",
  }, `${name} task`);

  await assertNoHorizontalPageOverflow(page, name);
  if (consoleErrors.length > 0) throw new Error(`${name} console errors: ${consoleErrors.join(" | ")}`);
  if (pageErrors.length > 0) throw new Error(`${name} page errors: ${pageErrors.join(" | ")}`);
  if (failedRequests.length > 0) throw new Error(`${name} failed requests: ${failedRequests.join(" | ")}`);
  await screenshot(page, `${name}-after-import.png`);
  await context.close();

  evidence.checks.push(
    `${name} imported hierarchy, cross-day time, commitment chips, plan-scoped booking, expense, note, and task without console/page/network errors or body overflow.`,
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
    throw new Error(
      `${name} has page-level horizontal overflow: ${JSON.stringify(result)}`,
    );
  }
}

function assertContains(value: string, expected: string, label: string) {
  if (!value.includes(expected)) {
    throw new Error(`${label} missing ${JSON.stringify(expected)}.`);
  }
}

function expectObject(
  actual: null | Record<string, unknown>,
  expected: Record<string, unknown>,
  label: string,
) {
  if (!actual) throw new Error(`${label} missing.`);
  for (const [key, value] of Object.entries(expected)) {
    if (actual[key] !== value) {
      throw new Error(`${label} expected ${key}=${JSON.stringify(value)}, got ${JSON.stringify(actual[key])}.`);
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

await main();
