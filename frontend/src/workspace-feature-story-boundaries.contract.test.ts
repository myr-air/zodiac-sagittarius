import { describe, expect, it } from "vitest";
import { frontendRoot } from "./project-contract.helpers";
import { readWorkspaceBoundarySources } from "./workspace-source-boundaries.sources";

describe("Sagittarius workspace feature story boundaries", () => {
  it("keeps itinerary story fixtures, builders, and plays split by responsibility", () => {
    const {
      contextRailStory,
      itineraryStoryFixtures,
      itineraryStoryPathScenarios,
      itineraryStoryPathItems,
      itineraryStoryPathOptions,
      itineraryPageStory,
      storyBuilders,
      itineraryPageStoryPlays,
      itineraryTemplateStory,
      itineraryTemplateStoryPlays,
      overviewPageStory,
      overviewTemplateStory,
      timelinePageStory,
      timelineTemplateStory,
      mapPageStory,
      mapTemplateStory,
      stopDialogStory,
      bookingsDocsPageStory,
      membersPageStory,
      photosPageStory,
      tripSettingsPageStory,
    } = readWorkspaceBoundarySources(frontendRoot);

    expect(itineraryStoryFixtures).toContain("./itinerary-story-path-scenarios");
    expect(itineraryStoryFixtures).not.toContain("buildItineraryStoryPathItems");
    expect(itineraryStoryFixtures).not.toContain("const stressPathItemsBase");
    expect(itineraryStoryPathScenarios).toContain("./fixtures/itinerary-story-path-items");
    expect(itineraryStoryPathScenarios).toContain("./itinerary-story-path-options");
    expect(itineraryStoryPathItems).toContain("./itinerary-story-alternative-items");
    expect(itineraryStoryPathItems).toContain("./itinerary-story-branch-items");
    expect(itineraryStoryPathItems).toContain("./itinerary-story-stress-items");
    expect(itineraryStoryPathOptions).toContain("export const stressPathOptions");
    expect(itineraryPageStory).toContain("@/src/shared/storybook/story-builders");
    expect(itineraryPageStory).toContain("./ItineraryPage.stories.plays");
    expect(itineraryPageStory).not.toContain("function ownerArgsStory");
    expect(itineraryTemplateStory).toContain("@/src/shared/storybook/story-builders");
    expect(itineraryTemplateStory).not.toContain("...Owner.args");
    expect(storyBuilders).toContain("export function argsStory");
    expect(storyBuilders).toContain("export function ownerArgsStory");
    expect(storyBuilders).toContain("export function viewportStory");
    expect(itineraryPageStory).not.toContain("./itinerary-story-assertions");
    expect(itineraryPageStoryPlays).toContain("./itinerary-story-assertions");
    expect(itineraryTemplateStory).toContain("./ItineraryTemplate.stories.plays");
    expect(itineraryTemplateStory).not.toContain("./itinerary-story-assertions");
    expect(itineraryTemplateStoryPlays).toContain("./itinerary-story-assertions");
    [
      overviewPageStory,
      overviewTemplateStory,
      timelinePageStory,
      timelineTemplateStory,
      mapPageStory,
      mapTemplateStory,
    ].forEach((storySource) => {
      expect(storySource).toContain("@/src/shared/storybook/story-builders");
      expect(storySource).not.toContain("...Owner.args");
    });
    [contextRailStory, stopDialogStory].forEach((storySource) => {
      expect(storySource).toContain("@/src/shared/storybook/story-builders");
      expect(storySource).not.toContain("defaultViewport:");
    });
    expect(tripSettingsPageStory).toContain("@/src/shared/storybook/story-builders");
    expect(tripSettingsPageStory).not.toContain("defaultViewport:");
    expect(bookingsDocsPageStory).toContain("@/src/shared/storybook/story-builders");
    expect(bookingsDocsPageStory).not.toContain("defaultViewport:");
    expect(membersPageStory).toContain("@/src/shared/storybook/story-builders");
    expect(membersPageStory).not.toContain("defaultViewport:");
    expect(photosPageStory).toContain("@/src/shared/storybook/story-builders");
    expect(photosPageStory).not.toContain("defaultViewport:");
  });
});
