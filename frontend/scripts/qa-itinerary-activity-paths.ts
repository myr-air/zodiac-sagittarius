import { mkdirSync } from "node:fs";
import { chromium, type Page } from "playwright";

const storyUrl = "http://127.0.0.1:6006/iframe.html?id=templates-itinerary--owner-thai&viewMode=story";
const screenshotDir = "../screenshots";

async function inspectPage(page: Page) {
  const tripPath = page.getByLabel("Trip path");
  const showAll = page.getByLabel("Show all paths");
  const clearAll = page.getByRole("button", { name: /Clear all day path overrides/i });
  const dayPath = page.getByLabel("Path for Day 2");
  const clearDay = page.getByRole("button", { name: /Clear path override for Day 2/i });

  await tripPath.waitFor({ state: "visible", timeout: 15_000 });
  await dayPath.waitFor({ state: "visible", timeout: 15_000 });

  const result = await page.evaluate(() => {
    const body = document.body;
    const overflowers = Array.from(document.querySelectorAll<HTMLElement>("body *"))
      .filter((element) => element.scrollWidth > element.clientWidth + 2)
      .slice(0, 12)
      .map((element) => ({
        tag: element.tagName,
        className: element.className?.toString() ?? "",
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
        text: element.textContent?.trim().slice(0, 80) ?? "",
      }));
    return {
      bodyTextLength: body.textContent?.trim().length ?? 0,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
      overflowers,
    };
  });

  return {
    tripPathValue: await tripPath.inputValue(),
    dayPathValue: await dayPath.inputValue(),
    showAllChecked: await showAll.isChecked(),
    clearAllEnabled: await clearAll.isEnabled(),
    clearDayEnabled: await clearDay.isEnabled(),
    ...result,
  };
}

async function main() {
  mkdirSync(screenshotDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const consoleMessages: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      consoleMessages.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ""}`));

  await page.goto(storyUrl, { waitUntil: "networkidle" });
  const desktop = await inspectPage(page);
  await page.screenshot({ path: `${screenshotDir}/itinerary-activity-paths-desktop.png`, fullPage: true });

  await page.reload({ waitUntil: "networkidle" });
  const afterReload = await inspectPage(page);

  await page.setViewportSize({ width: 390, height: 900 });
  await page.waitForTimeout(300);
  const mobile = await inspectPage(page);
  await page.screenshot({ path: `${screenshotDir}/itinerary-activity-paths-mobile.png`, fullPage: true });

  await browser.close();

  console.log(JSON.stringify({
    storyUrl,
    desktop,
    afterReload,
    mobile,
    consoleMessages,
    pageErrors,
    failedRequests,
  }, null, 2));
}

await main();
