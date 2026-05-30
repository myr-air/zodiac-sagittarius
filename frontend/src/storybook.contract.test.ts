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
    ].forEach((title) => expect(stories).toContain(`title: "${title}"`));
  });

  it("documents role and density states", () => {
    const stories = storyText();
    ["Owner", "Traveler", "Viewer", "Empty", "Dense", "Mobile"].forEach((stateName) => {
      expect(stories).toContain(`export const ${stateName}`);
    });
  });

  it("documents split account and trip access routes", () => {
    const stories = storyText();
    ["AccountLogin", "AccountRegister", "TripAccess", "TripAccessWithJoinCode"].forEach((stateName) => {
      expect(stories).toContain(`export const ${stateName}`);
    });
    expect(stories).toContain('accessMode: "account-login"');
    expect(stories).toContain('accessMode: "account-register"');
    expect(stories).toContain('accessMode: "trip-access"');
    expect(stories).toContain('initialJoinCode: localTripJoinId');
    expect(stories).toContain('pathname: `/join/${localTripJoinId}`');
  });
});
