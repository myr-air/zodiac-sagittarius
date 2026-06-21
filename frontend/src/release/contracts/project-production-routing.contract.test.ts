import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  collectProductCopyFiles,
  frontendRoot,
  productCopySourceRoots,
} from "../../project-contract.helpers";

describe("Sagittarius production and routing contracts", () => {
  it("uses Next App Router with trip-scoped production routes", () => {
    expect(readFileSync(join(frontendRoot, "app/page.tsx"), "utf8")).toContain("HomeLanding");
    const homeLanding = readFileSync(join(frontendRoot, "src/features/public-site/pages/home/HomeLanding.tsx"), "utf8");
    const homeLandingSections = readFileSync(join(frontendRoot, "src/features/public-site/pages/home/HomeLandingSections.tsx"), "utf8");
    const homeLandingPreview = readFileSync(join(frontendRoot, "src/features/public-site/pages/home/HomeLandingPreview.tsx"), "utf8");
    const homeLandingPreviewSections = readFileSync(join(frontendRoot, "src/features/public-site/pages/home/HomeLandingPreview.sections.tsx"), "utf8");
    const homeLandingMeta = readFileSync(join(frontendRoot, "src/features/public-site/pages/home/HomeLanding.meta.ts"), "utf8");
    const homeLandingStyles = readFileSync(join(frontendRoot, "src/features/public-site/pages/home/HomeLanding.styles.ts"), "utf8");
    const languageSwitch = readFileSync(join(frontendRoot, "src/i18n/LanguageSwitch.tsx"), "utf8");
    const languageSwitchMenu = readFileSync(join(frontendRoot, "src/i18n/LanguageSwitchMenu.tsx"), "utf8");
    const languageSwitchSupport = readFileSync(join(frontendRoot, "src/i18n/language-switch.support.ts"), "utf8");
    const languageSwitchState = readFileSync(join(frontendRoot, "src/i18n/use-language-switch-state.ts"), "utf8");
    expect(homeLandingSections).toContain("LanguageSwitch");
    expect(homeLanding).toContain("./HomeLandingPreview");
    expect(homeLandingSections).toContain("./HomeLanding.meta");
    expect(homeLanding).toContain("./HomeLanding.styles");
    expect(homeLanding).not.toContain("previewDayKeys");
    expect(homeLanding).not.toContain("checkedChecklistKeys");
    expect(homeLandingPreview).toContain("export function HomeLandingPreview");
    expect(homeLandingPreview).toContain("./HomeLandingPreview.sections");
    expect(homeLandingPreview).not.toContain("previewDayKeys");
    expect(homeLandingPreview).not.toContain("checkedChecklistKeys");
    expect(homeLandingPreviewSections).toContain("previewDayKeys");
    expect(homeLandingPreviewSections).toContain("checkedChecklistKeys");
    expect(homeLanding).not.toContain("const homePageClassName");
    expect(homeLanding).not.toContain("const workflowStepMeta");
    expect(homeLandingSections).toContain("workflowStepMeta");
    expect(homeLandingMeta).toContain("workflowStepMeta");
    expect(homeLandingMeta).toContain("previewDayKeys");
    expect(homeLandingStyles).toContain("homePageClassName");
    expect(homeLandingStyles).toContain("workflowToneClassNames");
    expect(languageSwitch).toContain("./language-switch.support");
    expect(languageSwitch).toContain("./LanguageSwitchMenu");
    expect(languageSwitch).toContain("./use-language-switch-state");
    expect(languageSwitch).not.toContain("useEffect");
    expect(languageSwitch).not.toContain("readStoredCurrency");
    expect(languageSwitch).not.toContain("majorCurrencyOptions");
    expect(languageSwitch).not.toContain("const triggerClassName");
    expect(languageSwitchMenu).toContain("majorCurrencyOptions");
    expect(languageSwitchState).toContain("readStoredCurrency");
    expect(languageSwitchState).toContain("window.localStorage.setItem(currencyStorageKey");
    expect(languageSwitchSupport).toContain("export const triggerClassName");
    expect(languageSwitchSupport).toContain("export function readStoredCurrency");
    expect(readFileSync(join(frontendRoot, "src/i18n/messages/en.home.ts"), "utf8")).toContain("Plan trips with friends");
    expect(readFileSync(join(frontendRoot, "src/i18n/messages/th.home.ts"), "utf8")).toContain("วางแผนทริปกับเพื่อน");
    expect(existsSync(join(frontendRoot, "app/access/page.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "app/login/page.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "app/register/page.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "app/portal/page.tsx"))).toBe(true);
    [
      "app/portal/my-trips/page.tsx",
      "app/portal/explorer/page.tsx",
      "app/portal/to-dos/page.tsx",
      "app/portal/vault/page.tsx",
      "app/portal/settings/page.tsx",
      "app/portal/sign-out/page.tsx",
    ].forEach((routeFile) => expect(existsSync(join(frontendRoot, routeFile))).toBe(true));
    expect(readFileSync(join(frontendRoot, "app/access/page.tsx"), "utf8")).toContain("appRoutes.portal()");
    expect(readFileSync(join(frontendRoot, "app/login/page.tsx"), "utf8")).toContain("redirect(appRoutes.login())");
    expect(readFileSync(join(frontendRoot, "app/register/page.tsx"), "utf8")).toContain("redirect(appRoutes.register())");
    expect(existsSync(join(frontendRoot, "app/trips/[tripId]/page.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "app/trips/[tripId]/itinerary/page.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "app/trips/[tripId]/map/page.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "app/trips/[tripId]/timeline/page.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "app/trips/[tripId]/members/page.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "app/join/page.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "app/join/[joinCode]/page.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "app/join/demo/page.tsx"))).toBe(false);
    expect(readFileSync(join(frontendRoot, "app/join/[joinCode]/page.tsx"), "utf8")).toContain("initialJoinCode={decodedJoinCode}");
    expect(readFileSync(join(frontendRoot, "app/layout.tsx"), "utf8")).toContain("Joii");
  });

  it("keeps the Calm Travel Ops design tokens in globals", () => {
    const css = readFileSync(join(frontendRoot, "app/globals.css"), "utf8");

    expect(css).toContain("--color-primary: #c24f16");
    expect(css).toContain("--color-route: #2563eb");
    expect(css).toContain("--color-warning: #b45309");
  });

  it("uses Trip Plan language in product copy instead of rollout compatibility names", () => {
    const messagesRoot = join(frontendRoot, "src/i18n/messages");
    const messages = readdirSync(messagesRoot)
      .filter((entry) => entry.endsWith(".ts"))
      .map((entry) => readFileSync(join(messagesRoot, entry), "utf8"))
      .join("\n");

    expect(messages).toContain("Trip Plan");
    expect(messages).not.toMatch(/\bTrip Sheet\b/i);
    expect(messages).not.toMatch(/\bPlan Variant\b/i);
  });

  it("keeps production frontend copy on Trip Plan terminology", () => {
    const productCopy = productCopySourceRoots
      .flatMap((root) => collectProductCopyFiles(join(frontendRoot, root)))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");

    expect(productCopy).toContain("Trip Plan");
    expect(productCopy).not.toMatch(/\bTrip Sheet\b/i);
    expect(productCopy).not.toMatch(/\bPlan Variant\b/i);
    expect(productCopy).not.toMatch(/\bplan variant\b/);
    expect(productCopy).not.toMatch(/\btrip sheet\b/i);
  });
});
