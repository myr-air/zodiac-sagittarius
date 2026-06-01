import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function collectStoryFiles(dir = "src"): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return collectStoryFiles(path);
    return entry.isFile() && entry.name.endsWith(".stories.tsx") ? [path] : [];
  });
}

function storyText() {
  return collectStoryFiles().map((file) => readFileSync(file, "utf8")).join("\n");
}

describe("Storybook template catalog", () => {
  it("contains design system, template, and page story categories", () => {
    const stories = storyText();
    [
      "Design System/Buttons",
      "Design System/Badges",
      "Design System/Page Header",
      "Design System/Travel Motifs",
      "Templates/Workspace Shell",
      "Templates/Overview",
      "Templates/Itinerary",
      "Templates/Timeline",
      "Templates/Map",
      "Templates/Members",
      "Pages/Overview",
      "Pages/Itinerary",
      "Pages/Timeline",
      "Pages/Map",
      "Pages/Members",
      "Pages/Home Landing",
    ].forEach((title) => expect(stories).toContain(`title: "${title}"`));
  });

  it("documents role and density states", () => {
    const stories = storyText();
    ["Owner", "OwnerThai", "Traveler", "Viewer", "Empty", "Dense", "Mobile"].forEach((stateName) => {
      expect(stories).toContain(`export const ${stateName}`);
    });
  });

  it("wraps stories in bilingual i18n controls with English as the default", () => {
    const preview = readFileSync(join(".storybook", "preview.ts"), "utf8");
    const stories = storyText();

    expect(preview).toContain("I18nProvider");
    expect(preview).toContain("globalTypes");
    expect(preview).toContain("defaultValue: defaultLocale");
    expect(stories).toContain('parameters: { locale: "th" }');
  });

  it("documents split account and trip access routes", () => {
    const stories = storyText();
    [
      "PublicEntry",
      "AccountLogin",
      "AccountRegister",
      "AccountPortal",
      "AccountPortalMyTrips",
      "AccountPortalExplorer",
      "AccountPortalToDos",
      "AccountPortalVault",
      "AccountPortalSettings",
      "AccountPortalSignOut",
      "AccountTrips",
      "AccountNewTrip",
      "TripAccess",
      "JoinWithDemoCredentials",
      "TripAccessWithJoinCode",
      "TripOverviewAccess",
      "TripItineraryAccess",
      "TripMapAccess",
      "TripTimelineAccess",
      "TripMembersAccess",
    ].forEach((stateName) => {
      expect(stories).toContain(`export const ${stateName}`);
    });
    expect(stories).toContain('accessMode: "account-login"');
    expect(stories).toContain('accessMode: "account-register"');
    expect(stories).toContain('accessMode: "account-portal"');
    expect(stories).toContain('accessMode: "trip-access"');
    expect(stories).toContain('portalSection: "trips"');
    expect(stories).toContain('portalSection: "explorer"');
    expect(stories).toContain('portalSection: "todos"');
    expect(stories).toContain('portalSection: "vault"');
    expect(stories).toContain('portalSection: "settings"');
    expect(stories).toContain('portalSection: "sign-out"');
    expect(stories).toContain('initialJoinCode: localTripJoinId');
    expect(stories).toContain('pathname: "/join"');
    expect(stories).toContain('pathname: `/join/${localTripJoinId}`');
  });

  it("requires access-gated app stories to declare an explicit access mode", () => {
    const appStories = readFileSync(join("src", "app", "SagittariusApp.stories.tsx"), "utf8");
    const gatedStoryLines = appStories.split("\n").filter((line) => line.includes("requireJoin: true"));

    expect(gatedStoryLines.length).toBeGreaterThan(0);
    gatedStoryLines.forEach((line) => {
      expect(line).toContain("accessMode:");
    });
  });
});
