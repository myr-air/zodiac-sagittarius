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
const storyUrl = `${trimTrailingSlash(storybookBaseUrl)}/iframe.html?id=sagittarius-app--itinerary&viewMode=story&preserveStoryStorage=1`;
const csvPath =
  process.env.SAGITTARIUS_ITINERARY_IMPORT_QA_CSV_PATH ??
  "/Users/xiivth/Downloads/Hongkong-Shenzhen - Trip plan.csv";
const tripStorageKey = "sagittarius:trip-draft";
const mainTripPlanId = "plan-main";
const importTargetTripPlanId = "plan-rain";

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
    csvPath,
    evidenceDir,
    storyUrl,
    storybookBaseUrl,
  },
  failures: [],
  observations: {},
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

  const tripPlanSelector = page.getByLabel("Trip Plan");
  await tripPlanSelector.selectOption(importTargetTripPlanId);
  const selectedTripPlanId = await tripPlanSelector.inputValue();
  if (selectedTripPlanId !== importTargetTripPlanId) {
    throw new Error(`${name} could not select import target Trip Plan ${importTargetTripPlanId}.`);
  }

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
  assertContains(bodyText, "1 sub", `${name} visible sub-activity count`);
  assertContains(bodyText, "1 booking", `${name} visible booking commitment`);
  assertContains(bodyText, "1 expense", `${name} visible expense commitment`);
  assertContains(bodyText, "1 task", `${name} visible task commitment`);
  assertContains(bodyText, "1 note", `${name} visible note commitment`);
  const importedBlockRow = page.getByRole("row", { name: /Browser QA flight block/i });
  const importedBlockSup = await importedBlockRow.locator("sup").first().textContent();
  if (importedBlockSup !== "+1") {
    throw new Error(`${name} visible cross-day offset was ${JSON.stringify(importedBlockSup)} instead of +1.`);
  }

  const persisted = await page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const trip = JSON.parse(raw);
    return {
      activePlanVariantId: trip.activePlanVariantId ?? null,
      itemCount: trip.itineraryItems?.filter((item: { activity?: string }) =>
        String(item.activity).startsWith("Browser QA"),
      ).length ?? 0,
      mainTripPlanId: trip.mainTripPlanId ?? null,
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
    activePlanVariantId: null | string;
    itemCount: number;
    mainTripPlanId: null | string;
    note: null | Record<string, unknown>;
    sub: null | Record<string, unknown>;
    task: null | Record<string, unknown>;
  } | null;

  if (!persisted) throw new Error(`${name} did not persist an imported trip draft.`);
  if (persisted.activePlanVariantId !== mainTripPlanId) {
    throw new Error(`${name} import changed activePlanVariantId to ${persisted.activePlanVariantId}.`);
  }
  if (persisted.mainTripPlanId !== mainTripPlanId) {
    throw new Error(`${name} import changed mainTripPlanId to ${persisted.mainTripPlanId}.`);
  }
  if (persisted.itemCount !== 2) throw new Error(`${name} expected 2 imported items, got ${persisted.itemCount}.`);
  expectObject(persisted.block, {
    activity: "Browser QA flight block",
    endOffsetDays: 1,
    endTime: "02:00",
    isPlanBlock: true,
    itemKind: "travel",
    planVariantId: importTargetTripPlanId,
    status: "confirmed",
  }, `${name} activity block`);
  expectObject(persisted.sub, {
    activity: "Browser QA check-in",
    parentItemId: "browser-flight-block",
    planVariantId: importTargetTripPlanId,
    timeMode: "flexible",
  }, `${name} sub-activity`);
  expectObject(persisted.expense, {
    itineraryItemId: "browser-flight-block",
    title: "Browser QA receipt",
    tripPlanId: importTargetTripPlanId,
  }, `${name} expense`);
  expectObject(persisted.booking, {
    title: "Browser QA booking",
    tripPlanId: importTargetTripPlanId,
  }, `${name} booking`);
  expectArrayContains(
    persisted.booking?.relatedItineraryItemIds,
    "browser-flight-block",
    `${name} booking itinerary link`,
  );
  expectObject(persisted.note, {
    body: "Browser QA note",
    itemId: "browser-flight-block",
    tripPlanId: importTargetTripPlanId,
  }, `${name} note`);
  expectObject(persisted.task, {
    relatedItemId: "browser-flight-block",
    title: "Browser QA task",
    tripPlanId: importTargetTripPlanId,
  }, `${name} task`);

  await importCsvFile(page, name);
  await importPastedTable(page, name);
  await verifyCsvAndPastePersistence(page, name);
  await screenshot(page, `${name}-after-csv-and-paste-import.png`);

  await page.goto(`${storyUrl}&tripPlanId=${encodeURIComponent(importTargetTripPlanId)}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector(".smart-table", { timeout: 15_000 });
  await ensureSelectedTripPlan(page, importTargetTripPlanId);
  await ensureShowAllPaths(page);
  await waitForVisibleText(
    page,
    [
      "Airport -> Shenzhen",
      "Civic center",
      "Browser QA pasted parent",
      "Browser QA pasted sub-item",
    ],
    `${name} reloaded imported rows`,
  );
  await verifyCsvAndPastePersistence(page, `${name} after reload`);
  await screenshot(page, `${name}-after-reload-direct-route.png`);

  await assertNoHorizontalPageOverflow(page, name);
  await assertNoHorizontalPageOverflow(page, `${name} after reload`);
  evidence.observations[name] = [
    `console errors: ${consoleErrors.length}`,
    `page errors: ${pageErrors.length}`,
    `failed requests: ${failedRequests.length}`,
  ];
  if (consoleErrors.length > 0) throw new Error(`${name} console errors: ${consoleErrors.join(" | ")}`);
  if (pageErrors.length > 0) throw new Error(`${name} page errors: ${pageErrors.join(" | ")}`);
  if (failedRequests.length > 0) throw new Error(`${name} failed requests: ${failedRequests.join(" | ")}`);
  await screenshot(page, `${name}-after-import.png`);
  await context.close();

  evidence.checks.push(
    `${name} imported JSON hierarchy with linked expense/booking/note/task, uploaded the real Hongkong-Shenzhen CSV, pasted TSV parent/sub-item rows, preserved Main Plan ${mainTripPlanId}, verified selected Trip Plan ${importTargetTripPlanId}, map links, open-ended/flexible rows, generated booking/task/note records, reload/direct-route persistence, console/page/network observations, and body overflow.`,
  );
}

async function importCsvFile(page: Page, name: string) {
  await openImportSourceDialog(page);
  await page.locator('input[type="file"]').first().setInputFiles(csvPath);
  const dialog = page.getByRole("dialog", {
    name: /ตั้งค่า import itinerary|import itinerary/i,
  });
  await dialog.waitFor({ state: "visible", timeout: 10_000 });
  const dialogText = (await dialog.textContent()) ?? "";
  assertContains(dialogText, "Check-in at Don Mueang", `${name} CSV preview`);
  assertContains(dialogText, "Records detected:", `${name} CSV linked record summary`);
  await dialog.getByLabel(/Target Trip Plan/i).selectOption(importTargetTripPlanId);
  await dialog.getByLabel(/ชื่อ path/i).fill("CSV QA");
  await dialog.getByRole("button", { name: /import itinerary/i }).click();
  await waitForStoredActivity(page, "Airport -> Shenzhen");
  await ensureSelectedTripPlan(page, importTargetTripPlanId);
  await ensureShowAllPaths(page);
  await waitForVisibleText(page, ["Airport -> Shenzhen", "Civic center"], `${name} CSV rows`);
}

async function importPastedTable(page: Page, name: string) {
  const sourceDialog = await openImportSourceDialog(page);
  await sourceDialog.getByLabel(/วางข้อมูลตาราง|Paste table data/i).fill(
    [
      "Day\tDate\tTime\tPlans\tMaps\tDuration\tTransportation\tNote",
      "DAY2 Hong Kong\t\t\t\t\t\t\t",
      "Friday\t19 June 2026\t\tBrowser QA pasted parent\t\t\t\t",
      "\t\t\t  - Browser QA pasted sub-item\thttps://maps.app.goo.gl/pasteQa\t\t\tNeed ticket estimate 88 HKD",
    ].join("\n"),
  );
  await sourceDialog.getByRole("button", { name: /Preview pasted rows/i }).click();
  const dialog = page.getByRole("dialog", {
    name: /ตั้งค่า import itinerary|import itinerary/i,
  });
  await dialog.waitFor({ state: "visible", timeout: 10_000 });
  const dialogText = (await dialog.textContent()) ?? "";
  assertContains(dialogText, "Browser QA pasted parent", `${name} pasted preview`);
  assertContains(dialogText, "2 activities", `${name} pasted row count`);
  await dialog.getByLabel(/Target Trip Plan/i).selectOption(importTargetTripPlanId);
  await dialog.getByLabel(/ชื่อ path/i).fill("Paste QA");
  await dialog.getByRole("button", { name: /import itinerary/i }).click();
  await waitForStoredActivity(page, "Browser QA pasted parent");
  await ensureSelectedTripPlan(page, importTargetTripPlanId);
  await ensureShowAllPaths(page);
  await waitForVisibleText(
    page,
    ["Browser QA pasted parent", "Browser QA pasted sub-item"],
    `${name} pasted rows`,
  );
}

async function openImportSourceDialog(page: Page) {
  await page.getByRole("button", { name: /^(นำเข้า|Import)$/i }).click();
  const dialog = page.getByRole("dialog", { name: /นำเข้า itinerary|Import itinerary/i });
  await dialog.waitFor({ state: "visible", timeout: 10_000 });
  return dialog;
}

async function ensureSelectedTripPlan(page: Page, tripPlanId: string) {
  const selector = page.getByLabel("Trip Plan");
  const current = await selector.inputValue();
  if (current !== tripPlanId) await selector.selectOption(tripPlanId);
}

async function ensureShowAllPaths(page: Page) {
  const toggle = page.getByLabel(/Show all paths/i);
  if (!(await toggle.isChecked())) await toggle.check();
}

async function waitForStoredActivity(page: Page, activity: string) {
  await page.waitForFunction(
    ({ key, activityName }) => {
      const raw = window.localStorage.getItem(key);
      if (!raw) return false;
      const trip = JSON.parse(raw);
      return trip.itineraryItems?.some(
        (item: { activity?: string }) => item.activity === activityName,
      );
    },
    { key: tripStorageKey, activityName: activity },
    { timeout: 10_000 },
  );
}

async function waitForVisibleText(page: Page, expected: string[], label: string) {
  try {
    for (const value of expected) {
      await page
        .getByRole("row", { name: new RegExp(escapeRegex(value), "i") })
        .first()
        .waitFor({ state: "visible", timeout: 10_000 });
    }
  } catch (error) {
    const debug = await page.evaluate((key) => {
      const raw = window.localStorage.getItem(key);
      const trip = raw ? JSON.parse(raw) : null;
      return {
        body: document.body?.innerText.slice(0, 2000) ?? "",
        selectedTripPlan:
          (document.querySelector('[aria-label="Trip Plan"]') as HTMLSelectElement | null)
            ?.value ?? null,
        showAllPaths:
          (document.querySelector('[aria-label="Show all paths"]') as HTMLInputElement | null)
            ?.checked ?? null,
        imported: trip?.itineraryItems
          ?.filter((item: { activity?: string }) =>
            ["Airport -> Shenzhen", "Civic center (ไฟรอบ 19.30/ 20.30/ 21.30)", "Browser QA pasted parent", "Browser QA pasted sub-item"].includes(item.activity ?? ""),
          )
          .map((item: { activity?: string; pathName?: string; planVariantId?: string }) => ({
            activity: item.activity,
            pathName: item.pathName,
            planVariantId: item.planVariantId,
          })),
      };
    }, tripStorageKey);
    throw new Error(
      `${label} not visible after import: ${JSON.stringify(debug)}\n${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function verifyCsvAndPastePersistence(page: Page, name: string) {
  const persisted = await page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const trip = JSON.parse(raw);
    const importedItems = trip.itineraryItems?.filter(
      (item: { details?: { importSource?: string }; pathName?: string; planVariantId?: string }) =>
        item.details?.importSource === "csv" && item.planVariantId === "plan-rain",
    ) ?? [];
    return {
      activePlanVariantId: trip.activePlanVariantId ?? null,
      mainTripPlanId: trip.mainTripPlanId ?? null,
      csvItemCount: importedItems.filter((item: { pathName?: string }) => item.pathName === "CSV QA").length,
      csvAirport: trip.itineraryItems?.find((item: { activity?: string; pathName?: string }) =>
        item.activity === "Airport -> Shenzhen" && item.pathName === "CSV QA",
      ) ?? null,
      csvCheckIn: trip.itineraryItems?.find((item: { activity?: string; pathName?: string }) =>
        item.activity === "Check-in at Don Mueang" && item.pathName === "CSV QA",
      ) ?? null,
      csvCivic: trip.itineraryItems?.find((item: { activity?: string; pathName?: string }) =>
        item.activity === "Civic center (ไฟรอบ 19.30/ 20.30/ 21.30)" && item.pathName === "CSV QA",
      ) ?? null,
      csvBooking: trip.bookingDocs?.find((booking: { title?: string }) =>
        booking.title === "Airport -> Shenzhen draft",
      ) ?? null,
      csvTask: trip.tasks?.find((task: { title?: string }) =>
        task.title === "Confirm Airport -> Shenzhen",
      ) ?? null,
      csvNote: trip.stopNotes?.find((note: { body?: string }) =>
        note.body === "จองตั๋วล่วงหน้า Bus A21 - 60 HKD",
      ) ?? null,
      pastedParent: trip.itineraryItems?.find((item: { activity?: string; pathName?: string }) =>
        item.activity === "Browser QA pasted parent" && item.pathName === "Paste QA",
      ) ?? null,
      pastedSub: trip.itineraryItems?.find((item: { activity?: string; pathName?: string }) =>
        item.activity === "Browser QA pasted sub-item" && item.pathName === "Paste QA",
      ) ?? null,
      pastedBooking: trip.bookingDocs?.find((booking: { title?: string }) =>
        booking.title === "Browser QA pasted sub-item draft",
      ) ?? null,
    };
  }, tripStorageKey) as null | {
    activePlanVariantId: null | string;
    csvAirport: null | Record<string, unknown>;
    csvBooking: null | Record<string, unknown>;
    csvCheckIn: null | Record<string, unknown>;
    csvCivic: null | Record<string, unknown>;
    csvItemCount: number;
    csvNote: null | Record<string, unknown>;
    csvTask: null | Record<string, unknown>;
    mainTripPlanId: null | string;
    pastedBooking: null | Record<string, unknown>;
    pastedParent: null | Record<string, unknown>;
    pastedSub: null | Record<string, unknown>;
  };

  if (!persisted) throw new Error(`${name} did not persist imported CSV/paste data.`);
  if (persisted.activePlanVariantId !== mainTripPlanId) {
    throw new Error(`${name} CSV import changed activePlanVariantId to ${persisted.activePlanVariantId}.`);
  }
  if (persisted.mainTripPlanId !== mainTripPlanId) {
    throw new Error(`${name} CSV import changed mainTripPlanId to ${persisted.mainTripPlanId}.`);
  }
  if (persisted.csvItemCount < 40) {
    throw new Error(`${name} expected at least 40 real CSV rows, got ${persisted.csvItemCount}.`);
  }
  expectObject(persisted.csvCheckIn, {
    isPlanBlock: true,
    planVariantId: importTargetTripPlanId,
    timeMode: "flexible",
  }, `${name} CSV flexible parent block`);
  expectObject(persisted.csvAirport, {
    activityType: "travel",
    itemKind: "travel",
    planVariantId: importTargetTripPlanId,
    startTime: "13:00",
    endTime: "14:00",
    priority: "high",
  }, `${name} CSV travel row`);
  expectObject(persisted.csvCivic, {
    mapLink: "https://surl.amap.com/5upxC7jrz6pa",
    planVariantId: importTargetTripPlanId,
    startTime: "20:50",
    endTime: null,
  }, `${name} CSV open-ended map row`);
  expectObject(persisted.csvBooking, {
    currency: "HKD",
    priceAmount: 60,
    status: "draft",
    tripPlanId: importTargetTripPlanId,
  }, `${name} CSV booking draft`);
  expectObject(persisted.csvTask, {
    relatedItemId: persisted.csvAirport?.id,
    tripPlanId: importTargetTripPlanId,
  }, `${name} CSV booking task`);
  expectObject(persisted.csvNote, {
    itemId: persisted.csvAirport?.id,
    tripPlanId: importTargetTripPlanId,
  }, `${name} CSV note`);
  expectObject(persisted.pastedParent, {
    isPlanBlock: true,
    planVariantId: importTargetTripPlanId,
  }, `${name} pasted parent`);
  expectObject(persisted.pastedSub, {
    parentItemId: persisted.pastedParent?.id,
    mapLink: "https://maps.app.goo.gl/pasteQa",
    planVariantId: importTargetTripPlanId,
    timeMode: "flexible",
  }, `${name} pasted sub-item`);
  expectObject(persisted.pastedBooking, {
    currency: "HKD",
    priceAmount: 88,
    status: "draft",
    tripPlanId: importTargetTripPlanId,
  }, `${name} pasted booking estimate`);
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
