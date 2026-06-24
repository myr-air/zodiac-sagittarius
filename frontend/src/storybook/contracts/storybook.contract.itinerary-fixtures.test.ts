import { describe, expect, it } from "vitest";
import { readProjectFile } from "./storybook.contract.test-support";

describe("Storybook itinerary fixture contracts", () => {
  it("keeps itinerary story item builders separate from scenario fixtures", () => {
    const storyFixtures = readProjectFile(
      "src",
      "features",
      "itinerary",
      "stories",
      "support",
      "itinerary-story-fixtures.ts",
    );
    const storyItemBuilders = readProjectFile(
      "src",
      "features",
      "itinerary",
      "stories",
      "support",
      "itinerary-story-item-builders.ts",
    );

    expect(storyFixtures).toContain("./itinerary-story-item-builders");
    expect(storyFixtures).toContain("@/src/trip/testing/fixtures/trip-story-fixtures");
    expect(storyFixtures).not.toContain("buildDenseTripFixture");
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
      "support",
      "itinerary-story-path-scenarios.ts",
    );
    const pathOptions = readProjectFile(
      "src",
      "features",
      "itinerary",
      "stories",
      "support",
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
    const branchItems = readProjectFile(
      "src",
      "features",
      "itinerary",
      "stories",
      "fixtures",
      "itinerary-story-branch-items.ts",
    );
    const alternativeItems = readProjectFile(
      "src",
      "features",
      "itinerary",
      "stories",
      "fixtures",
      "itinerary-story-alternative-items.ts",
    );
    const stressItems = readProjectFile(
      "src",
      "features",
      "itinerary",
      "stories",
      "fixtures",
      "itinerary-story-stress-items.ts",
    );

    expect(pathScenarios).toContain("./itinerary-story-path-options");
    expect(pathScenarios).toContain("./fixtures/itinerary-story-path-items");
    expect(pathScenarios).not.toContain("buildItineraryStoryItem");
    expect(pathOptions).toContain("branchGraphPathOptions");
    expect(pathOptions).not.toContain("buildItineraryStoryPathItems");
    expect(pathItems).toContain("./itinerary-story-branch-items");
    expect(pathItems).toContain("./itinerary-story-alternative-items");
    expect(pathItems).toContain("./itinerary-story-stress-items");
    expect(branchItems).toContain("buildItineraryStoryItem");
    expect(alternativeItems).toContain("buildItineraryStoryPathItems");
    expect(stressItems).toContain("buildItineraryStoryPathItems");
    expect(pathItems).not.toContain("branchGraphPathOptions");
  });
});
