import { spawn, spawnSync, type ChildProcessByStdio } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join as joinPath } from "node:path";
import type { Readable } from "node:stream";
import { setTimeout as delay } from "node:timers/promises";
import { chromium, type Browser, type Page } from "playwright";
import { createTripApiClient, TripApiError } from "../src/trip/api-client";

const databaseUrl = process.env.DATABASE_URL ?? "postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test";
const backendManifest = "../backend/Cargo.toml";
const apiBindAddress = process.env.SAGITTARIUS_PROD_BROWSER_QA_API_BIND_ADDR ?? "127.0.0.1:5181";
const frontendHost = process.env.SAGITTARIUS_PROD_BROWSER_QA_FRONTEND_HOST ?? "127.0.0.1";
const frontendPort = process.env.SAGITTARIUS_PROD_BROWSER_QA_FRONTEND_PORT ?? "5182";
const apiBaseUrl = `http://${apiBindAddress}`;
const frontendBaseUrl = `http://${frontendHost}:${frontendPort}`;
const psql = process.env.PSQL ?? "psql";
const runId = process.env.SAGITTARIUS_PROD_BROWSER_QA_RUN_ID ?? Date.now().toString(36);
const evidenceDir = process.env.SAGITTARIUS_PROD_BROWSER_QA_EVIDENCE_DIR ?? joinPath(tmpdir(), "sagittarius-staging-evidence", runId);
const desktopViewport = { width: 1440, height: 960 };
const mobileViewport = { width: 390, height: 844 };
const joinId = "HK-SZ-2025";
const tripPassword = "dim-sum-run";
const ownerPassword = `owner-${runId}`;
const viewerPassword = `viewer-${runId}`;
const tripId = "018f4e80-5788-7de0-a45c-8a555d17fc2d";
const seededMemberIds: Record<string, string> = {
  Aom: "018f4e81-77a4-7b8f-b3bd-0d0f493ac561",
  Family: "018f4e81-77a4-7b8f-b3bd-0d0f493ac564",
};
type LoggedProcess = ChildProcessByStdio<null, Readable, Readable>;

interface Evidence {
  checks: string[];
  commands: string[];
  environment: Record<string, string>;
  failures: string[];
  finishedAt?: string;
  screenshots: string[];
  startedAt: string;
  status: "running" | "passed" | "failed";
}

const evidence: Evidence = {
  checks: [],
  commands: [],
  environment: {
    apiBaseUrl,
    databaseUrl,
    evidenceDir,
    frontendBaseUrl,
    note: "Local deployed staging on this machine: real Postgres + real Rust API + Next production build/start.",
  },
  failures: [],
  screenshots: [],
  startedAt: new Date().toISOString(),
  status: "running",
};

async function main() {
  const processes: LoggedProcess[] = [];
  let browser: Browser | null = null;

  await mkdir(evidenceDir, { recursive: true });

  try {
    await run("cargo", ["run", "--manifest-path", backendManifest, "--bin", "seed_e2e"], {
      DATABASE_URL: databaseUrl,
    });
    evidence.checks.push("Seeded local staging database with real migrations and e2e trip data.");

    const api = spawnLogged("api", "cargo", ["run", "--manifest-path", backendManifest, "--bin", "sagittarius-api"], {
      DATABASE_URL: databaseUrl,
      RUST_LOG: "info,tower_http=info,sagittarius_api=info",
      SAGITTARIUS_BIND_ADDR: apiBindAddress,
    });
    processes.push(api);
    await waitForHealth(`${apiBaseUrl}/api/v1/health`, "API");
    evidence.checks.push("Real API health check passed.");

    await run("bun", ["run", "build"], {
      NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL: apiBaseUrl,
    });
    evidence.checks.push("Next production build completed against the local staging API URL.");

    const frontend = spawnLogged("frontend", "bun", ["run", "start"], {
      HOSTNAME: frontendHost,
      NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL: apiBaseUrl,
      PORT: frontendPort,
    });
    processes.push(frontend);
    await waitForHealth(`${frontendBaseUrl}/access?mode=sign-in`, "frontend");
    evidence.checks.push("Next production server is reachable.");

    browser = await chromium.launch({ headless: true });
    await runPortalCustomerFlows(browser);
    await runTripCustomerFlows(browser);
    await runApiWriteAndPermissionFlows();

    evidence.status = "passed";
  } catch (error) {
    evidence.status = "failed";
    evidence.failures.push(error instanceof Error ? error.stack ?? error.message : String(error));
    throw error;
  } finally {
    evidence.finishedAt = new Date().toISOString();
    await browser?.close();
    for (const child of [...processes].reverse()) {
      child.kill("SIGTERM");
    }
    await writeEvidence();
  }
}

async function runPortalCustomerFlows(browser: Browser) {
  const email = `prod-browser-${runId}@example.test`;
  const password = "browser-production-password-2026";
  const displayName = `Production Browser ${runId}`;

  const register = await newCheckedPage(browser);
  await register.page.goto(`${frontendBaseUrl}/access?mode=register`, { waitUntil: "networkidle" });
  await expectMainLabel(register.page, "Account register");
  await register.page.getByLabel("Email *").fill(email);
  await register.page.getByRole("button", { name: /^Continue$/ }).click();
  await register.page.getByLabel("Password").fill(password);
  await register.page.getByRole("button", { name: /^Continue$/ }).click();
  await register.page.getByLabel("Verification code *").waitFor({ state: "visible" });
  await register.page.getByLabel("Verification code *").fill(await waitForEmailCode(email));
  await register.page.getByRole("button", { name: /^Create my trip space$/ }).click();
  await register.page.getByLabel("Display name *").fill(displayName);
  await register.page.getByLabel("Home base").fill("Bangkok");
  await register.page.getByRole("button", { name: /^Finish and start planning$/ }).click();
  await register.page.waitForURL("**/portal", { timeout: 15_000 });
  await expectText(register.page, "Dashboard");
  await expectText(register.page, displayName);
  await screenshot(register.page, "01-portal-register-desktop.png");
  register.assertNoConsoleErrors();
  await register.close();
  evidence.checks.push("Browser customer registration, email-code lookup, onboarding, and portal landing passed.");

  const desktop = await newCheckedPage(browser);
  await passwordSignIn(desktop.page, { email, password });
  await expectPortalDashboard(desktop.page, { displayName, email });
  await desktop.page.reload({ waitUntil: "networkidle" });
  await expectPortalDashboard(desktop.page, { displayName, email });
  await desktop.page.goto(`${frontendBaseUrl}/portal/to-dos`, { waitUntil: "networkidle" });
  await expectText(desktop.page, "Trip To-dos");
  await desktop.page.goto(`${frontendBaseUrl}/portal/vault`, { waitUntil: "networkidle" });
  await expectText(desktop.page, "Travel Vault");
  await screenshot(desktop.page, "02-portal-vault-desktop.png");
  desktop.assertNoConsoleErrors();
  await desktop.close();
  evidence.checks.push("Browser password sign-in, session reload, to-dos, and vault navigation passed.");

  const mobile = await newCheckedPage(browser, mobileViewport);
  await passwordSignIn(mobile.page, { email, password });
  await expectPortalDashboard(mobile.page, { displayName, email });
  await mobile.page.goto(`${frontendBaseUrl}/portal/settings`, { waitUntil: "networkidle" });
  await expectVisibleSelector(mobile.page, "#portal-settings");
  await assertNoHorizontalPageOverflow(mobile.page);
  await screenshot(mobile.page, "03-portal-settings-mobile.png");
  mobile.assertNoConsoleErrors();
  await mobile.close();
  evidence.checks.push("Mobile portal settings passed without horizontal overflow.");
}

async function runTripCustomerFlows(browser: Browser) {
  const owner = await newCheckedPage(browser);
  await joinTripAs(owner.page, "Aom", ownerPassword);
  await expectText(owner.page, "Hong Kong");
  await screenshot(owner.page, "04-trip-overview-owner-desktop.png");

  await owner.page.locator(`a[href="/trips/${tripId}/itinerary"]`).first().click();
  await expectVisibleSelector(owner.page, "#itinerary");
  await expectText(owner.page, "Dim Dim Sum");
  await screenshot(owner.page, "05-trip-itinerary-owner-desktop.png");

  await owner.page.locator(`a[href="/trips/${tripId}/members"]`).first().click();
  await expectText(owner.page, "Members");
  await createMemberThroughBrowser(owner.page, `QA Browser Guest ${runId}`);
  await screenshot(owner.page, "06-trip-members-created-desktop.png");
  owner.assertNoConsoleErrors();
  await owner.close();
  evidence.checks.push("Browser trip join, overview, itinerary, and member create write-flow passed for owner.");

  const mobile = await newCheckedPage(browser, mobileViewport);
  await joinTripAs(mobile.page, "Family", viewerPassword);
  await mobile.page.locator(`a[href="/trips/${tripId}/itinerary"]`).first().click();
  await expectVisibleSelector(mobile.page, "#itinerary");
  await assertViewerCannotRestructure(mobile.page);
  await assertNoHorizontalPageOverflow(mobile.page);
  await screenshot(mobile.page, "07-trip-itinerary-viewer-mobile-readonly.png");
  mobile.assertNoConsoleErrors();
  await mobile.close();
  evidence.checks.push("Browser viewer permission path blocks itinerary restructure and mobile layout has no overflow.");
}

async function runApiWriteAndPermissionFlows() {
  const client = createTripApiClient({ baseUrl: apiBaseUrl });
  const ownerSession = await loginSession(client, "Aom", ownerPassword);
  const cockpit = await client.loadTrip(tripId, ownerSession.sessionToken);
  const planVariantId = cockpit.trip.activePlanVariantId || cockpit.trip.planVariants[0]?.id;
  const firstItem = cockpit.trip.itineraryItems[0];
  ensure(planVariantId, "Expected active plan variant.");
  ensure(firstItem, "Expected seeded itinerary item.");

  const createdItem = await client.createItineraryItem(tripId, ownerSession.sessionToken, {
    activity: `Production QA stop ${runId}`,
    activityType: "experience",
    clientMutationId: `prod-qa-item-${runId}`,
    day: firstItem.day,
    durationMinutes: 25,
    mapLink: "https://maps.google.com/?q=Production%20QA%20stop",
    note: "created by production browser QA",
    place: "Production QA pier",
    planVariantId,
    startTime: "16:10",
    transportation: "walk",
  });

  await client.reorderItineraryItems(tripId, ownerSession.sessionToken, {
    clientMutationId: `prod-qa-reorder-${runId}`,
    day: createdItem.day,
    itemIds: [
      createdItem.id,
      ...cockpit.trip.itineraryItems
        .filter((item) => item.planVariantId === createdItem.planVariantId && item.day === createdItem.day)
        .map((item) => item.id),
    ],
    planVariantId: createdItem.planVariantId,
  });

  const createdNote = await client.createStopNote(tripId, ownerSession.sessionToken, {
    body: "Production QA note",
    clientMutationId: `prod-qa-note-${runId}`,
    itineraryItemId: createdItem.id,
  });
  const patchedNote = await client.patchStopNote(tripId, createdNote.id, ownerSession.sessionToken, {
    body: "Production QA note updated",
    clientMutationId: `prod-qa-note-patch-${runId}`,
    expectedVersion: createdNote.version ?? 1,
  });
  ensure(patchedNote.body === "Production QA note updated", "Stop note patch did not persist.");

  const splits = { [ownerSession.memberId]: 4567 };
  const createdExpense = await client.createExpense(tripId, ownerSession.sessionToken, {
    amountMinor: 4567,
    category: "food",
    clientMutationId: `prod-qa-expense-${runId}`,
    currency: "HKD",
    itineraryItemId: createdItem.id,
    paidBy: ownerSession.memberId,
    splits,
    title: "Production QA snack",
  });
  const patchedExpense = await client.patchExpense(tripId, createdExpense.id, ownerSession.sessionToken, {
    amountMinor: 5000,
    category: "food",
    clientMutationId: `prod-qa-expense-patch-${runId}`,
    expectedVersion: createdExpense.version ?? 1,
    itineraryItemId: createdItem.id,
    paidBy: ownerSession.memberId,
    splits: { [ownerSession.memberId]: 5000 },
    title: "Production QA snack updated",
  });
  ensure(patchedExpense.title === "Production QA snack updated", "Expense patch did not persist.");

  await client.deleteExpense(tripId, createdExpense.id, ownerSession.sessionToken);
  await client.deleteStopNote(tripId, createdNote.id, ownerSession.sessionToken);
  await client.deleteItineraryItem(tripId, createdItem.id, ownerSession.sessionToken);

  const viewerSession = await loginSession(client, "Family", viewerPassword);
  await expectForbidden(() => client.createItineraryItem(tripId, viewerSession.sessionToken, {
    activity: `Forbidden viewer stop ${runId}`,
    activityType: "experience",
    clientMutationId: `prod-qa-viewer-item-${runId}`,
    day: firstItem.day,
    place: "Forbidden QA pier",
    planVariantId,
  }));

  evidence.checks.push("Real API create/reorder/delete itinerary, stop-note CRUD, expense CRUD, and viewer 403 permission check passed.");
}

async function joinTripAs(page: Page, memberName: string, password: string) {
  await page.goto(`${frontendBaseUrl}/join/${joinId}`, { waitUntil: "networkidle" });
  await page.locator("label").filter({ hasText: "Trip ID" }).locator("input").fill(joinId);
  await page.locator("label").filter({ hasText: "Trip password" }).locator("input").fill(tripPassword);
  await page.locator("form").first().locator("button[type='submit']").click();
  await page.getByRole("button", { name: new RegExp(memberName) }).click();
  const passwordInput = page.locator("form[role='group'] input[type='password']").first();
  await passwordInput.fill(password);
  await page.locator("form[role='group'] button[type='submit']").click();
  await expectText(page, "Overview");
}

async function createMemberThroughBrowser(page: Page, displayName: string) {
  await page.locator(".member-create-button").click();
  await page.locator(".member-create-panel input").fill(displayName);
  await page.locator(".member-create-panel select").selectOption("viewer");
  await page.locator(".member-create-panel button[type='submit']").click();
  await expectText(page, displayName);
  await page.reload({ waitUntil: "networkidle" });
  await expectText(page, displayName);
}

async function assertViewerCannotRestructure(page: Page) {
  const addStop = page.locator(".add-stop-button").first();
  await addStop.waitFor({ state: "visible", timeout: 10_000 });
  const disabled = await addStop.isDisabled();
  ensure(disabled, "Viewer can click Add stop or activity.");
  await expectText(page, "Editing requires organizer access.");
}

async function passwordSignIn(page: Page, input: { email: string; password: string }) {
  await page.goto(`${frontendBaseUrl}/access?mode=sign-in`, { waitUntil: "networkidle" });
  await expectMainLabel(page, "Account sign in");
  await page.getByLabel("Email *").fill(input.email);
  await page.getByRole("button", { name: /^Continue$/ }).click();
  await page.getByRole("button", { name: /^Use password$/ }).click();
  await page.getByLabel("Password").fill(input.password);
  await page.getByRole("button", { name: /^Use password$/ }).click();
}

async function expectPortalDashboard(page: Page, input: { email: string; displayName: string }) {
  await page.waitForURL("**/portal", { timeout: 15_000 });
  await expectText(page, "Dashboard");
  await expectText(page, input.displayName);
  await expectText(page, input.email);
}

async function loginSession(client: ReturnType<typeof createTripApiClient>, memberName: string, password: string) {
  const join = await client.joinTrip({ joinId, password: tripPassword });
  const claimableMember = join.claimableMembers.find((candidate) => candidate.displayName === memberName);
  const memberId = claimableMember?.id ?? seededMemberIds[memberName];
  ensure(memberId, `Expected member ${memberName}.`);
  if (!claimableMember) {
    return client.loginMember(join.trip.id, memberId, password, join.joinSessionToken);
  }
  try {
    return await client.claimMember(join.trip.id, memberId, password, join.joinSessionToken);
  } catch (caught) {
    if (!(caught instanceof TripApiError) || !["invalid_request", "unauthenticated"].includes(caught.code)) throw caught;
    return client.loginMember(join.trip.id, memberId, password, join.joinSessionToken);
  }
}

async function expectForbidden(action: () => Promise<unknown>) {
  try {
    await action();
  } catch (caught) {
    if (caught instanceof TripApiError && caught.status === 403) return;
    throw caught;
  }
  throw new Error("Expected request to be forbidden.");
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
}

async function newCheckedPage(
  browser: Browser,
  viewport: { width: number; height: number } = desktopViewport,
): Promise<{ assertNoConsoleErrors: () => void; close: () => Promise<void>; page: Page }> {
  const context = await browser.newContext({
    reducedMotion: "no-preference",
    viewport,
  });
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("response", (response) => {
    const url = response.url();
    if (response.status() >= 400 && (url.startsWith(apiBaseUrl) || url.startsWith(frontendBaseUrl))) {
      consoleErrors.push(`${response.status()} ${response.request().method()} ${url}`);
    }
  });

  return {
    assertNoConsoleErrors: () => {
      if (consoleErrors.length) {
        throw new Error(`Browser/network errors:\n${consoleErrors.join("\n")}`);
      }
    },
    close: () => context.close(),
    page,
  };
}

async function screenshot(page: Page, filename: string) {
  const path = joinPath(evidenceDir, filename);
  await page.screenshot({ fullPage: false, path });
  evidence.screenshots.push(path);
}

async function expectText(page: Page, text: string) {
  await page.getByText(text, { exact: false }).first().waitFor({ state: "visible", timeout: 10_000 });
}

async function expectMainLabel(page: Page, label: string) {
  await page.locator(`main[aria-label="${label}"]`).waitFor({ state: "visible", timeout: 10_000 });
}

async function expectVisibleSelector(page: Page, selector: string) {
  await page.locator(selector).waitFor({ state: "visible", timeout: 10_000 });
}

async function waitForEmailCode(email: string): Promise<string> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const code = latestEmailCode(email);
    if (code) return code;
    await delay(250);
  }

  throw new Error(`Timed out waiting for email login code for ${email}`);
}

function latestEmailCode(email: string): string | null {
  const [psqlCommand, ...psqlPrefixArgs] = splitCommand(psql);
  const status = spawnSync(psqlCommand, [
    ...psqlPrefixArgs,
    databaseUrl,
    "-tAc",
    `select code from email_login_outbox where normalized_email = lower('${email}') order by created_at desc limit 1`,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: process.env,
  });

  if (status.status !== 0) {
    throw new Error(`${psql} exited with ${status.status}: ${status.stderr}`);
  }

  return status.stdout.trim() || null;
}

async function waitForHealth(url: string, name: string) {
  const deadline = Date.now() + 45_000;
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
  evidence.commands.push(`${command} ${args.join(" ")}`);
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...env,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => process.stdout.write(`[${name}] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[${name}] ${chunk}`));

  return child;
}

async function run(command: string, args: string[], env: Record<string, string>) {
  evidence.commands.push(`${command} ${args.join(" ")}`);
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

async function writeEvidence() {
  await writeFile(joinPath(evidenceDir, "evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`);
  await writeFile(joinPath(evidenceDir, "evidence.md"), renderMarkdownEvidence());
  process.stdout.write(`\nproduction browser QA evidence: ${joinPath(evidenceDir, "evidence.md")}\n`);
}

function renderMarkdownEvidence(): string {
  return [
    "# Sagittarius Local Deployed Staging Browser QA",
    "",
    `- Status: ${evidence.status}`,
    `- Started: ${evidence.startedAt}`,
    `- Finished: ${evidence.finishedAt ?? ""}`,
    `- Frontend: ${frontendBaseUrl}`,
    `- API: ${apiBaseUrl}`,
    `- DB: ${databaseUrl}`,
    `- Evidence dir: ${evidenceDir}`,
    "- Browser plugin: not available in this session; regular Playwright Chromium used.",
    "",
    "## Checks",
    ...evidence.checks.map((check) => `- ${check}`),
    "",
    "## Screenshots",
    ...evidence.screenshots.map((path) => `- ${path}`),
    "",
    "## Commands",
    ...evidence.commands.map((command) => `- ${command}`),
    "",
    "## Failures",
    ...(evidence.failures.length ? evidence.failures.map((failure) => `- ${failure}`) : ["- None"]),
    "",
  ].join("\n");
}

function splitCommand(command: string): string[] {
  return command.trim().split(/\s+/).filter(Boolean);
}

function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

await main();
