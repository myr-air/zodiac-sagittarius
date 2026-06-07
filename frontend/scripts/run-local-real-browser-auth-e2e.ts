import { spawn, spawnSync, type ChildProcessByStdio } from "node:child_process";
import type { Readable } from "node:stream";
import { setTimeout as delay } from "node:timers/promises";
import { chromium, type Browser, type Page } from "playwright";

const databaseUrl = process.env.DATABASE_URL ?? "postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test";
const backendManifest = "../backend/Cargo.toml";
const apiBindAddress = process.env.SAGITTARIUS_BROWSER_E2E_API_BIND_ADDR ?? "127.0.0.1:5191";
const frontendHost = process.env.SAGITTARIUS_BROWSER_E2E_FRONTEND_HOST ?? "127.0.0.1";
const frontendPort = process.env.SAGITTARIUS_BROWSER_E2E_FRONTEND_PORT ?? "5190";
const apiBaseUrl = `http://${apiBindAddress}`;
const frontendBaseUrl = `http://${frontendHost}:${frontendPort}`;
const psql = process.env.PSQL ?? "psql";
const desktopViewport = { width: 1440, height: 960 };
const mobileViewport = { width: 390, height: 844 };
type LoggedProcess = ChildProcessByStdio<null, Readable, Readable>;

async function main() {
  const runId = Date.now().toString(36);
  const email = `browser-auth-${runId}@example.test`;
  const password = "browser-e2e-password-2026";
  const displayName = `Browser E2E ${runId}`;
  const processes: LoggedProcess[] = [];
  let browser: Browser | null = null;

  await run("cargo", ["run", "--manifest-path", backendManifest, "--bin", "seed_e2e"], {
    DATABASE_URL: databaseUrl,
    SAGITTARIUS_ALLOW_E2E_DB_RESET: "1",
  });

  const api = spawnLogged("api", "cargo", ["run", "--manifest-path", backendManifest, "--bin", "sagittarius-api"], {
    DATABASE_URL: databaseUrl,
    SAGITTARIUS_BIND_ADDR: apiBindAddress,
  });
  processes.push(api);

  try {
    await waitForHealth(`${apiBaseUrl}/api/v1/health`, "API");

    await run("bun", ["run", "build"], {
      NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL: apiBaseUrl,
    });
    const frontend = spawnLogged("frontend", "bun", ["run", "start"], {
      HOSTNAME: frontendHost,
      NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL: apiBaseUrl,
      PORT: frontendPort,
    });
    processes.push(frontend);
    await waitForHealth(`${frontendBaseUrl}/access?mode=sign-in`, "frontend");

    browser = await chromium.launch({ headless: true });
    await registerThroughBrowser(browser, { email, password, displayName });
    await signInThroughBrowser(browser, { email, password, displayName });
    await signInThroughMobileBrowser(browser, { email, password, displayName });
  } finally {
    await browser?.close();
    for (const child of [...processes].reverse()) {
      child.kill("SIGTERM");
    }
  }
}

async function registerThroughBrowser(browser: Browser, input: { email: string; password: string; displayName: string }) {
  const { page, assertNoConsoleErrors } = await newCheckedPage(browser);

  await page.goto(`${frontendBaseUrl}/access?mode=register`, { waitUntil: "networkidle" });
  await expectMainLabel(page, "Account register");
  await page.getByLabel("Email *").fill(input.email);
  await page.getByRole("button", { name: /^Continue$/ }).click();

  await page.getByLabel("Password").fill(input.password);
  await page.getByRole("button", { name: /^Continue$/ }).click();

  await page.getByLabel("Verification code *").waitFor({ state: "visible" });
  const code = await waitForEmailCode(input.email);
  await page.getByLabel("Verification code *").fill(code);
  await page.getByRole("button", { name: /^Create my trip space$/ }).click();

  await page.getByLabel("Display name *").fill(input.displayName);
  await page.getByLabel("Home base").fill("Bangkok");
  await page.getByRole("button", { name: /^Finish and start planning$/ }).click();

  await page.waitForURL("**/portal", { timeout: 15_000 });
  await expectText(page, "Dashboard");
  await expectText(page, input.displayName);
  await expectText(page, input.email);

  assertNoConsoleErrors();
  await page.close();
}

async function signInThroughBrowser(browser: Browser, input: { email: string; password: string; displayName: string }) {
  const { page, assertNoConsoleErrors } = await newCheckedPage(browser);

  await passwordSignIn(page, input);
  await expectPortalDashboard(page, input);
  await page.reload({ waitUntil: "networkidle" });
  await expectPortalDashboard(page, input);
  await page.goto(`${frontendBaseUrl}/portal/to-dos`, { waitUntil: "networkidle" });
  await expectText(page, "Trip To-dos");
  await page.goto(`${frontendBaseUrl}/portal/vault`, { waitUntil: "networkidle" });
  await expectText(page, "Travel Vault");

  assertNoConsoleErrors();
  await page.close();
}

async function signInThroughMobileBrowser(browser: Browser, input: { email: string; password: string; displayName: string }) {
  const { page, assertNoConsoleErrors } = await newCheckedPage(browser, mobileViewport);

  await passwordSignIn(page, input);
  await expectPortalDashboard(page, input);
  await assertNoHorizontalPageOverflow(page);
  await page.goto(`${frontendBaseUrl}/portal/settings`, { waitUntil: "networkidle" });
  await expectVisibleSelector(page, "#portal-settings");
  await assertNoHorizontalPageOverflow(page);

  assertNoConsoleErrors();
  await page.close();
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
): Promise<{ page: Page; assertNoConsoleErrors: () => void }> {
  const context = await browser.newContext({
    viewport,
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  return {
    page,
    assertNoConsoleErrors: () => {
      if (consoleErrors.length) {
        throw new Error(`Browser console errors:\n${consoleErrors.join("\n")}`);
      }
    },
  };
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
    env: process.env,
    encoding: "utf8",
  });

  if (status.status !== 0) {
    throw new Error(`${psql} exited with ${status.status}: ${status.stderr}`);
  }

  return status.stdout.trim() || null;
}

function splitCommand(command: string): string[] {
  return command.trim().split(/\s+/).filter(Boolean);
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
