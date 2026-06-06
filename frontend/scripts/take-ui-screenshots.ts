import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { chromium, type Page } from "playwright";

const databaseUrl = process.env.DATABASE_URL ?? "postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test";
const frontendBaseUrl = "http://127.0.0.1:5180";
const psql = process.env.PSQL ?? "docker exec -i sagittarius-test-postgres psql";
const outputDir = "/Users/xiivth/workspace/zodiac/sagittarius-ux-fix/screenshots";

// Ensure output dir exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function splitCommand(command: string): string[] {
  return command.trim().split(/\s+/).filter(Boolean);
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

async function waitForEmailCode(email: string): Promise<string> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const code = latestEmailCode(email);
    if (code) return code;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for email login code for ${email}`);
}

async function captureViewports(page: Page, filenameBase: string) {
  // Desktop
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.waitForTimeout(1000); // stable animations
  await page.screenshot({ path: path.join(outputDir, `${filenameBase}-desktop.png`), fullPage: true });

  // Mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, `${filenameBase}-mobile.png`), fullPage: true });

  // Reset to desktop default
  await page.setViewportSize({ width: 1440, height: 960 });
}

async function main() {
  console.log("Starting UI Walkthrough and Screenshot Capturing...");
  const browser = await chromium.launch({ headless: true });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const runId = Date.now().toString(36);
    const email = `test-user-${runId}@example.test`;
    const password = "password123456";
    const displayName = `Aegis ${runId}`;

    // 1. Landing Page
    console.log("1. Capturing Landing Page...");
    await page.goto(`${frontendBaseUrl}/`, { waitUntil: "networkidle" });
    await captureViewports(page, "01-landing-page");

    // 2. Access Register
    console.log("2. Capturing Access Register...");
    await page.goto(`${frontendBaseUrl}/access?mode=register`, { waitUntil: "networkidle" });
    await captureViewports(page, "02-register-page");

    // 3. Register user
    console.log("3. Registering a user...");
    await page.getByLabel("Email *").fill(email);
    await page.getByRole("button", { name: /^Continue$/ }).click();
    await page.waitForTimeout(500);

    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button", { name: /^Continue$/ }).click();
    await page.waitForTimeout(500);

    const code = await waitForEmailCode(email);
    await page.getByLabel("Verification code *").fill(code);
    await page.getByRole("button", { name: /^Create my trip space$/ }).click();
    await page.waitForTimeout(500);

    await page.getByLabel("Display name *").fill(displayName);
    await page.getByLabel("Home base").fill("Bangkok");
    await captureViewports(page, "03-onboarding-name-page");
    await page.getByRole("button", { name: /^Finish and start planning$/ }).click();

    // Wait for redirect to portal
    await page.waitForURL("**/portal", { timeout: 15_000 });
    console.log("4. Capturing Portal/Dashboard...");
    await captureViewports(page, "04-portal-dashboard");

    // 5. Sign In Page
    console.log("5. Capturing Login Page...");
    const logoutContext = await browser.newContext();
    const logoutPage = await logoutContext.newPage();
    await logoutPage.goto(`${frontendBaseUrl}/access?mode=sign-in`, { waitUntil: "networkidle" });
    await captureViewports(logoutPage, "05-login-page");
    await logoutPage.close();
    await logoutContext.close();

    // 6. Join flow for HK-SZ-2025
    console.log("6. Capturing Join flow...");
    await page.goto(`${frontendBaseUrl}/join/HK-SZ-2025`, { waitUntil: "networkidle" });
    await captureViewports(page, "06-join-trip-prompt");

    // Enter trip password
    console.log("Entering Trip password...");
    await page.locator('input[type="password"]').fill("seed-trip-pass");
    await page.getByRole("button", { name: /Enter trip|เข้าห้อง/i }).click();
    await page.waitForTimeout(1000);
    await captureViewports(page, "07-join-select-member");

    // Select Beam (organizer)
    console.log("Selecting Beam...");
    await page.click('text="Beam"');
    await page.waitForTimeout(1000);
    await captureViewports(page, "08-join-member-selected");

    // Click Start / เริ่มใช้งาน to claim participant
    console.log("Claiming Beam...");
    // Let's set a password for the member first
    await page.locator('input[type="password"]').fill("beam-pass-2026");
    await page.getByRole("button", { name: /Start|เริ่มใช้งาน/i }).click();
    await page.waitForTimeout(2000);

    // 7. Cockpit Cockpit Overview
    console.log("7. Capturing Cockpit Overview...");
    await captureViewports(page, "09-cockpit-overview");

    // 8. Cockpit Itinerary
    console.log("8. Go to Itinerary...");
    await page.goto(`${frontendBaseUrl}/trips/018f4e80-5788-7de0-a45c-8a555d17fc2d/itinerary`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await captureViewports(page, "10-cockpit-itinerary");

    // 9. Cockpit Map
    console.log("9. Go to Map...");
    await page.goto(`${frontendBaseUrl}/trips/018f4e80-5788-7de0-a45c-8a555d17fc2d/map`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await captureViewports(page, "11-cockpit-map");

    // 10. Cockpit Timeline
    console.log("10. Go to Timeline...");
    await page.goto(`${frontendBaseUrl}/trips/018f4e80-5788-7de0-a45c-8a555d17fc2d/timeline`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await captureViewports(page, "12-cockpit-timeline");

    // 11. Cockpit Members
    console.log("11. Go to Members...");
    await page.goto(`${frontendBaseUrl}/trips/018f4e80-5788-7de0-a45c-8a555d17fc2d/members`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await captureViewports(page, "13-cockpit-members");

    // 12. Open Expenses Workspace in Context Rail
    console.log("12. Opening Expenses Workspace...");
    await page.click('button[title="Expenses"], button[title="ค่าใช้จ่าย"]');
    await page.waitForTimeout(1000);
    await captureViewports(page, "14-cockpit-expenses-rail");

    console.log("Screenshot Capturing Complete! Images saved to:", outputDir);

  } catch (error) {
    console.error("Error during execution:", error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
