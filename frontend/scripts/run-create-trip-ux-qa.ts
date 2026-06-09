import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join as joinPath, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { chromium, type Browser, type ConsoleMessage, type Page } from "playwright";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(scriptsDir, "..");
const frontendBaseUrl = process.env.SAGITTARIUS_CREATE_TRIP_UX_QA_FRONTEND_URL ?? "http://127.0.0.1:5180";
const evidenceDir = process.env.SAGITTARIUS_CREATE_TRIP_UX_QA_EVIDENCE_DIR ?? joinPath(tmpdir(), "sagittarius-create-trip-ux-qa");
const tripId = "018f4e80-5788-7de0-a45c-8a555d17fc2d";

interface QaEvidence {
  checks: string[];
  consoleMessages: string[];
  failures: string[];
  screenshots: string[];
  status: "running" | "passed" | "failed";
}

const evidence: QaEvidence = {
  checks: [],
  consoleMessages: [],
  failures: [],
  screenshots: [],
  status: "running",
};

async function main() {
  let frontend: ChildProcessWithoutNullStreams | null = null;
  let browser: Browser | null = null;

  await mkdir(evidenceDir, { recursive: true });

  try {
    if (!(await isReachable(frontendBaseUrl))) {
      frontend = spawn("bun", ["run", "dev"], {
        cwd: frontendRoot,
        env: process.env,
        stdio: "pipe",
      });
      await waitForFrontend();
      evidence.checks.push(`Started local frontend at ${frontendBaseUrl}.`);
    } else {
      evidence.checks.push(`Used existing frontend at ${frontendBaseUrl}.`);
    }

    browser = await chromium.launch({ headless: true });
    await runPortalEmptyStateQa(browser);
    await runCreateTripBuilderQa(browser);
    await runMapFallbackQa(browser);

    evidence.status = "passed";
  } catch (error) {
    evidence.status = "failed";
    evidence.failures.push(error instanceof Error ? error.stack ?? error.message : String(error));
    throw error;
  } finally {
    await browser?.close();
    frontend?.kill("SIGTERM");
    await writeEvidence();
  }
}

async function runPortalEmptyStateQa(browser: Browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    sessionStorage.setItem("sagittarius-account-session", JSON.stringify({
      userId: "qa-user",
      sessionToken: "qa-account-session",
      kind: "trusted",
      trustedDeviceId: "qa-device",
      createdAt: "2026-06-09T01:00:00.000Z",
      expiresAt: "2026-07-09T01:00:00.000Z",
    }));
  });

  const page = await context.newPage();
  attachConsoleChecks(page);
  await mockEmptyAccountApi(page);

  await page.goto(`${frontendBaseUrl}/portal/my-trips`, { waitUntil: "networkidle" });
  await page.getByText("Create your first trip").waitFor({ state: "visible", timeout: 10_000 });
  await expectNoFrameworkOverlay(page);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, "portal-my-trips-empty-desktop.png");
  evidence.checks.push("Desktop My Trips empty state renders an operational CTA instead of a blank portal page.");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${frontendBaseUrl}/portal/to-dos`, { waitUntil: "networkidle" });
  await page.getByText("Create a trip to start shared to-dos").waitFor({ state: "visible", timeout: 10_000 });
  await expectNoFrameworkOverlay(page);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, "portal-to-dos-empty-mobile.png");
  evidence.checks.push("Mobile Trip To-dos empty state renders without horizontal overflow.");

  await context.close();
}

async function runCreateTripBuilderQa(browser: Browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    sessionStorage.setItem("sagittarius-account-session", JSON.stringify({
      userId: "qa-user",
      sessionToken: "qa-account-session",
      kind: "trusted",
      trustedDeviceId: "qa-device",
      createdAt: "2026-06-09T01:00:00.000Z",
      expiresAt: "2026-07-09T01:00:00.000Z",
    }));
    localStorage.setItem("sagittarius-language", "en");
    localStorage.setItem("sagittarius-currency", "HKD");
  });

  const page = await context.newPage();
  attachConsoleChecks(page);
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort());
  await mockEmptyAccountApi(page);

  await page.goto(`${frontendBaseUrl}/portal/trips/new`, { waitUntil: "networkidle" });
  await page.getByRole("form", { name: /Create trip/i }).waitFor({ state: "visible", timeout: 10_000 });
  await fillCreateTripBuilder(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoFrameworkOverlay(page);
  await expectNoHorizontalOverflow(page);
  await expectCreateTripTextFit(page, 96);
  await screenshot(page, "create-trip-builder-desktop.png");
  evidence.checks.push("Desktop create-trip builder renders selected destinations and draft summary without text squeeze or metadata concatenation.");

  await page.getByRole("group", { name: /Route trip calendar/i }).scrollIntoViewIfNeeded();
  await expectDateSectionDensity(page);
  await screenshot(page, "create-trip-builder-dates-desktop.png");
  evidence.checks.push("Desktop create-trip date section renders compact calendar controls without oversized cells or clipped actions.");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: /Preview step/i }).click();
  await expectNoFrameworkOverlay(page);
  await expectNoHorizontalOverflow(page);
  await expectCreateTripTextFit(page, 220);
  await screenshot(page, "create-trip-builder-mobile-preview.png");
  evidence.checks.push("Mobile create-trip preview step renders without horizontal overflow or clipped destination text.");

  await context.close();
}

async function runMapFallbackQa(browser: Browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    sessionStorage.setItem("sagittarius:trip-participant-session", JSON.stringify({
      tripId: "018f4e80-5788-7de0-a45c-8a555d17fc2d",
      memberId: "member-aom",
      sessionToken: "qa-trip-session",
      expiresAt: "2026-07-09T01:00:00.000Z",
    }));
  });

  const page = await context.newPage();
  attachConsoleChecks(page);
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort());
  await mockTripMapApi(page);

  await page.goto(`${frontendBaseUrl}/trips/${tripId}/map`, { waitUntil: "networkidle" });
  await page.getByText("Could not load the live map. Showing the fallback route diagram.").waitFor({ state: "visible", timeout: 15_000 });
  await expectNoFrameworkOverlay(page);
  await expectNoHorizontalOverflow(page);

  const mapState = await page.locator("[data-live-map-state]").getAttribute("data-live-map-state");
  if (mapState !== "error") {
    throw new Error(`Expected map fallback state to be error, got ${mapState ?? "missing"}.`);
  }

  const mapStatus = await page.locator("[data-live-map-state] [role='status']").textContent();
  if (mapStatus !== "Could not load the live map. Showing the fallback route diagram.") {
    throw new Error(`Expected visible map fallback status, got ${mapStatus ?? "missing"}.`);
  }

  await screenshot(page, "map-fallback-desktop.png");
  evidence.checks.push("Map route shows a visible fallback status when OpenFreeMap tiles fail.");

  await context.close();
}

async function fillCreateTripBuilder(page: Page) {
  await page.getByLabel(/Trip name/i).fill("ทริปกล่องสุ่ม");
  await page.getByLabel(/Search destination cities/i).fill("Shenzhen");
  await page.getByRole("button", { name: /^Shenzhen, China$/i }).click();
  await page.getByLabel(/Search destination cities/i).fill("Hong Kong");
  await page.getByRole("button", { name: /^Hong Kong, Hong Kong$/i }).click();
  await page.getByLabel(/Start date/i).fill("2026-06-19");
  await page.getByLabel(/End date/i).fill("2026-06-25");
  await page.getByText("Invite ready").waitFor({ state: "visible", timeout: 10_000 });
}

async function expectCreateTripTextFit(page: Page, minimumTextWidth: number) {
  const result = await page.evaluate((minimumWidth) => {
    const root = document.querySelector("form[aria-label='Create trip']");
    const text = root?.textContent ?? "";
    const visibleCards = Array.from(document.querySelectorAll<HTMLElement>(".trip-preview-destination-card"))
      .filter((card) => {
        const style = window.getComputedStyle(card);
        const rect = card.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      });
    const squeezed = visibleCards.flatMap((card) => Array.from(card.querySelectorAll<HTMLElement>("strong, small")).map((node) => ({
      text: node.textContent?.replace(/\s+/g, " ").trim() ?? "",
      width: node.getBoundingClientRect().width,
    }))).filter((node) => node.text && node.width < minimumWidth);

    return {
      concatenated: text.includes("ChinaAsia") || text.includes("Hong KongAsia"),
      cardCount: visibleCards.length,
      squeezed,
    };
  }, minimumTextWidth);

  if (result.concatenated) throw new Error("Create-trip destination metadata is concatenated.");
  if (result.cardCount < 2) throw new Error(`Expected at least two visible preview destination cards, got ${result.cardCount}.`);
  if (result.squeezed.length) {
    throw new Error(`Create-trip preview text is squeezed below ${minimumTextWidth}px: ${JSON.stringify(result.squeezed)}`);
  }
}

async function expectDateSectionDensity(page: Page) {
  const result = await page.evaluate(() => {
    const section = document.querySelector<HTMLElement>(".trip-route-calendar");
    const calendarButtons = Array.from(section?.querySelectorAll<HTMLElement>(".trip-calendar-grid button") ?? []);
    const footer = section?.querySelector<HTMLElement>(".trip-calendar-footer");
    const helper = section?.querySelector<HTMLElement>(".trip-calendar-helper");
    const oversizedButtons = calendarButtons.map((button) => button.getBoundingClientRect()).filter((rect) => rect.height > 40);
    return {
      buttonCount: calendarButtons.length,
      footerHeight: footer?.getBoundingClientRect().height ?? 0,
      helperHeight: helper?.getBoundingClientRect().height ?? 0,
      oversizedCount: oversizedButtons.length,
      sectionWidth: section?.getBoundingClientRect().width ?? 0,
    };
  });

  if (result.buttonCount < 28) throw new Error(`Expected date grid buttons, got ${result.buttonCount}.`);
  if (result.oversizedCount > 0) throw new Error(`Expected compact date buttons, got ${result.oversizedCount} oversized buttons.`);
  if (result.footerHeight > 44) throw new Error(`Expected compact date footer, got ${result.footerHeight}px.`);
  if (result.helperHeight > 56) throw new Error(`Expected compact date helper, got ${result.helperHeight}px.`);
  if (result.sectionWidth <= 0) throw new Error("Date section is not visible.");
}

async function mockEmptyAccountApi(page: Page) {
  await page.route("**/api/v1/account", (route) => route.fulfill({
    contentType: "application/json",
    status: 200,
    body: JSON.stringify({
      profile: {
        id: "qa-user",
        displayName: "QA Organizer",
        avatarColor: "#0f766e",
        locale: "en-US",
        timezone: "Asia/Bangkok",
        primaryEmail: "qa@example.test",
      },
      passkeys: [],
      trustedDevices: [],
    }),
  }));
  await page.route("**/api/v1/account/trips", (route) => route.fulfill({ contentType: "application/json", status: 200, body: "[]" }));
  await page.route("**/api/v1/account/trip-stats", (route) => route.fulfill({
    contentType: "application/json",
    status: 200,
    body: JSON.stringify({ tripsTotal: 0, tripsOwned: 0, activeTrips: 0, tempClaimsCompleted: 0 }),
  }));
  await page.route("**/api/v1/account/explorer", (route) => route.fulfill({
    contentType: "application/json",
    status: 200,
    body: JSON.stringify({ upcomingTrips: 0, ownedTrips: 0, destinationCount: 0, nextTrip: null }),
  }));
  await page.route("**/api/v1/account/to-dos", (route) => route.fulfill({ contentType: "application/json", status: 200, body: "[]" }));
  await page.route("**/api/v1/account/vault", (route) => route.fulfill({ contentType: "application/json", status: 200, body: "[]" }));
}

async function mockTripMapApi(page: Page) {
  const itemBase = {
    tripId,
    planVariantId: "plan-main",
    linkLabel: "Map",
    mapLink: "",
    durationMinutes: 90,
    transportation: "MTR",
    note: "",
    createdBy: "member-aom",
    updatedAt: "2026-06-09T01:00:00.000Z",
    version: 1,
  };

  const cockpit = {
    trip: {
      id: tripId,
      name: "QA Hong Kong Sprint",
      destinationLabel: "Hong Kong, Shenzhen",
      destinationCities: [],
      countries: ["Hong Kong", "China"],
      startDate: "2026-06-18",
      endDate: "2026-06-23",
      joinId: "TRP-26-QA",
      activePlanVariantId: "plan-main",
      ownerMemberId: "member-aom",
      version: 1,
    },
    members: [{
      id: "member-aom",
      tripId,
      displayName: "Aom",
      role: "owner",
      accessStatus: "active",
      presence: "online",
      color: "#0f766e",
      userId: "qa-user",
      claimedAt: "2026-06-09T01:00:00.000Z",
      lastSeenAt: null,
    }],
    planVariants: [{ id: "plan-main", tripId, name: "Main", kind: "main", description: "", version: 1 }],
    itineraryItems: [
      {
        ...itemBase,
        id: "item-1",
        day: "2026-06-18",
        sortOrder: 1,
        startTime: "09:00",
        activity: "Victoria Peak",
        activityType: "sightseeing",
        place: "Hong Kong",
        coordinates: { lat: 22.2759, lng: 114.1455 },
        address: "Hong Kong",
      },
      {
        ...itemBase,
        id: "item-2",
        day: "2026-06-19",
        sortOrder: 2,
        startTime: "10:00",
        activity: "OCT Loft",
        activityType: "sightseeing",
        place: "Shenzhen",
        transportation: "Train",
        coordinates: { lat: 22.5408, lng: 113.9346 },
        address: "Shenzhen",
      },
    ],
    suggestions: [],
    tasks: [],
    stopNotes: [],
    expenses: [],
    expenseSummary: null,
    bookingDocs: [],
    photoAlbumLinks: [],
  };

  await page.route(`**/api/v1/trips/${tripId}`, (route) => route.fulfill({
    contentType: "application/json",
    status: 200,
    body: JSON.stringify(cockpit),
  }));
  await page.route(`**/api/v1/trips/${tripId}/daily-briefings`, (route) => route.fulfill({
    contentType: "application/json",
    status: 200,
    body: "[]",
  }));
  await page.route(`**/api/v1/trips/${tripId}/presence`, (route) => route.fulfill({ status: 204, body: "" }));
}

function attachConsoleChecks(page: Page) {
  page.on("console", (message) => {
    if (["error", "warning", "warn"].includes(message.type()) && !isAllowedConsoleMessage(message)) {
      evidence.consoleMessages.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    evidence.consoleMessages.push(`pageerror: ${error.message}`);
  });
}

function isAllowedConsoleMessage(message: ConsoleMessage) {
  const text = message.text();
  const url = message.location().url;
  return (
    url.includes("static.cloudflareinsights.com") ||
    text.includes("tiles.openfreemap.org") ||
    text.includes("net::ERR_FAILED") ||
    text.includes("GPU stall due to ReadPixels")
  );
}

async function expectNoFrameworkOverlay(page: Page) {
  const hasOverlay = await page.locator("[data-nextjs-dialog-overlay]").count();
  if (hasOverlay > 0) throw new Error("Next.js framework error overlay is visible.");
}

async function expectNoHorizontalOverflow(page: Page) {
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  if (hasOverflow) throw new Error("Page has horizontal overflow.");
}

async function screenshot(page: Page, filename: string) {
  const filePath = joinPath(evidenceDir, filename);
  await page.screenshot({ path: filePath, fullPage: false });
  evidence.screenshots.push(filePath);
}

async function waitForFrontend() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (await isReachable(frontendBaseUrl)) return;
    await delay(500);
  }
  throw new Error(`Timed out waiting for frontend at ${frontendBaseUrl}.`);
}

async function isReachable(url: string) {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

async function writeEvidence() {
  if (evidence.consoleMessages.length > 0 && evidence.status === "passed") {
    evidence.status = "failed";
    evidence.failures.push(`Unexpected console/page errors: ${evidence.consoleMessages.join("; ")}`);
  }

  const evidencePath = joinPath(evidenceDir, "evidence.json");
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(`Create trip UX QA ${evidence.status}. Evidence: ${evidencePath}`);
  for (const screenshotPath of evidence.screenshots) {
    console.log(`Screenshot: ${screenshotPath}`);
  }
  if (evidence.status === "failed") {
    process.exitCode = 1;
  }
}

main().catch(() => {
  process.exitCode = 1;
});
