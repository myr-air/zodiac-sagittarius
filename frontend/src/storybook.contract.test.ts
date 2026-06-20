import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  requiredAccessRouteStoryStates,
  requiredAppResponsiveStates,
  requiredGlobalStoryStates,
  requiredStoryCategories,
  requiredTemplateStates,
} from "./storybook.contract.required-states";
import { requiredPageStates } from "./storybook.contract.page-states";
import {
  collectStoryFiles,
  expectStoryExports,
  readProjectFile,
  storyText,
} from "./storybook.contract.test-support";

describe("Storybook template catalog", () => {
  it("contains design system, template, and page story categories", () => {
    const stories = storyText();
    requiredStoryCategories.forEach((title) =>
      expect(stories).toContain(`title: "${title}"`),
    );
  });

  it("documents role and density states", () => {
    const stories = storyText();
    requiredGlobalStoryStates.forEach((stateName) => {
      expect(stories).toContain(`export const ${stateName}`);
    });
  });

  it("documents page-level role, density, and viewport states per cockpit page", () => {
    requiredPageStates.forEach(([file, stateNames]) => {
      expectStoryExports(file, stateNames);
    });
  });

  it("documents top-level cockpit owner, traveler, and viewer roles", () => {
    const appStories = readProjectFile(
      "src",
      "app",
      "SagittariusApp.stories.tsx",
    );

    ["Owner", "OwnerThai", "Traveler", "Viewer", "Dense", "Empty"].forEach(
      (stateName) => {
        expect(appStories).toContain(`export const ${stateName}`);
      },
    );
    expect(appStories).toContain("initialMemberId: travelerMemberId");
    expect(appStories).toContain("initialMemberId: viewerMemberId");
  });

  it("documents app-level responsive stories for every primary cockpit view", () => {
    expectStoryExports(
      "app/SagittariusApp.stories.tsx",
      requiredAppResponsiveStates,
    );
  });

  it("documents structural template states for shell and reusable cockpit views", () => {
    requiredTemplateStates.forEach(([file, stateNames]) => {
      expectStoryExports(file, stateNames);
    });
  });

  it("keeps viewport and antigravity UX QA entry points available", () => {
    const preview = readProjectFile(".storybook", "preview.ts");
    const packageJson = JSON.parse(readProjectFile("package.json")) as {
      scripts?: Record<string, string>;
    };
    const stories = storyText();

    ["mobile320", "tablet768", "desktop1024", "desktop1440"].forEach(
      (viewportName) => {
        expect(preview).toContain(viewportName);
      },
    );
    expect(stories).not.toContain('defaultViewport: "mobile1"');
    expect(packageJson.scripts?.["test:storybook:agy"]).toBe(
      "bun run scripts/run-storybook-agy-ux-qa.ts",
    );
    expect(existsSync(join("scripts", "run-storybook-agy-ux-qa.ts"))).toBe(true);
    expect(existsSync(join("..", "docs", "storybook-ux-ui-qa.md"))).toBe(true);
  });

  it("wraps stories in bilingual i18n controls with English as the default", () => {
    const preview = readProjectFile(".storybook", "preview.ts");
    const stories = storyText();

    expect(preview).toContain("I18nProvider");
    expect(preview).toContain("globalTypes");
    expect(preview).toContain("defaultValue: defaultLocale");
    expect(stories).toContain('parameters: { locale: "th" }');
  });

  it("keeps repeated story callback placeholders centralized", () => {
    const localNoopDefinitions = collectStoryFiles().flatMap((file) => {
      const story = readProjectFile(file);
      return [
        ...story.matchAll(/const noop = (?:async )?\(\) => \{\};/g),
      ].map((match) => `${file}:${match.index ?? 0}`);
    });

    expect(localNoopDefinitions).toEqual([]);
    expect(readProjectFile("src", "testing", "storybook-actions.ts")).toContain(
      "export function noop",
    );
  });

  it("documents split account and trip access routes", () => {
    const stories = storyText();
    requiredAccessRouteStoryStates.forEach((stateName) => {
      expect(stories).toContain(`export const ${stateName}`);
    });
    expect(stories).toContain('accessMode: "account-login"');
    expect(stories).toContain('accessMode: "account-register"');
    expect(stories).toContain('accessMode: "account-portal"');
    expect(stories).toContain('accessMode: "trip-access"');
    expect(stories).toContain('portalSection: "trips"');
    expect(stories).toContain('portalSection: "new-trip"');
    expect(stories).toContain('portalSection: "explorer"');
    expect(stories).toContain('portalSection: "todos"');
    expect(stories).toContain('portalSection: "vault"');
    expect(stories).toContain('portalSection: "settings"');
    expect(stories).toContain('portalSection: "sign-out"');
    expect(stories).toContain('initialJoinCode: seedTripJoinId');
    expect(stories).toContain("pathname: appRoutes.join()");
    expect(stories).toContain("pathname: appRoutes.join(seedTripJoinId)");
    expect(stories).toContain('title: "Pages/Account Access"');
    expect(stories).toContain("export const NewTripBuilder");
    expect(stories).toContain("export const NewTripMobile");
  });

  it("requires access-gated app stories to declare an explicit access mode", () => {
    const appStories = readProjectFile(
      "src",
      "app",
      "SagittariusApp.stories.tsx",
    );
    const gatedStoryLines = appStories
      .split("\n")
      .filter((line) => line.includes("requireJoin: true"));

    expect(gatedStoryLines.length).toBeGreaterThan(0);
    gatedStoryLines.forEach((line) => {
      expect(line).toContain("accessMode:");
    });
  });

  it("keeps itinerary story item builders separate from scenario fixtures", () => {
    const storyFixtures = readProjectFile(
      "src",
      "features",
      "itinerary",
      "stories",
      "itinerary-story-fixtures.ts",
    );
    const storyItemBuilders = readProjectFile(
      "src",
      "features",
      "itinerary",
      "stories",
      "itinerary-story-item-builders.ts",
    );

    expect(storyFixtures).toContain("./itinerary-story-item-builders");
    expect(storyFixtures).not.toContain("function buildItineraryStoryItem");
    expect(storyItemBuilders).toContain("export function buildItineraryStoryItem");
    expect(storyItemBuilders).toContain("export function buildItineraryStoryPathItems");
    expect(storyItemBuilders).toContain("export function withStoryPrefix");
  });

  it("keeps itinerary story path options split from item scenario datasets", () => {
    const pathScenarios = readProjectFile(
      "src",
      "features",
      "itinerary",
      "stories",
      "itinerary-story-path-scenarios.ts",
    );
    const pathOptions = readProjectFile(
      "src",
      "features",
      "itinerary",
      "stories",
      "itinerary-story-path-options.ts",
    );
    const pathItems = readProjectFile(
      "src",
      "features",
      "itinerary",
      "stories",
      "fixtures",
      "itinerary-story-path-items.ts",
    );

    expect(pathScenarios).toContain("./itinerary-story-path-options");
    expect(pathScenarios).toContain("./fixtures/itinerary-story-path-items");
    expect(pathScenarios).not.toContain("buildItineraryStoryItem");
    expect(pathOptions).toContain("branchGraphPathOptions");
    expect(pathOptions).not.toContain("buildItineraryStoryPathItems");
    expect(pathItems).toContain("buildItineraryStoryPathItems");
    expect(pathItems).not.toContain("branchGraphPathOptions");
  });
});
