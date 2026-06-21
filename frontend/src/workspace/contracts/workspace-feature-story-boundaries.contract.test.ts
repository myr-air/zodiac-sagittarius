import { describe, expect, it } from "vitest";
import { frontendRoot } from "../../project-contract.helpers";
import { readWorkspaceBoundarySources } from "./workspace-source-boundaries.sources";

describe("Sagittarius workspace feature story boundaries", () => {
  it("keeps itinerary story fixtures, builders, and plays split by responsibility", () => {
    const {
      contextRailStory,
      itineraryStoryFixtures,
      itineraryStoryPathScenarios,
      itineraryStoryPathItems,
      itineraryStoryPathOptions,
      sagittariusAppStory,
      itineraryPageStory,
      storyBuilders,
      languageSwitchStory,
      uiPrimitivesStory,
      weatherForecastStripStory,
      weatherBriefingDrawerStory,
      itineraryPageStoryPlays,
      itineraryTemplateStory,
      itineraryTemplateStoryPlays,
      appShellStory,
      overviewPageStory,
      overviewTemplateStory,
      expensesPageStory,
      timelinePageStory,
      timelineTemplateStory,
      mapPageStory,
      mapTemplateStory,
      homeLandingStory,
      aboutAppPageStory,
      stopDialogStory,
      bookingsDocsPageStory,
      tripJoinGateStory,
      membersPageStory,
      membersTemplateStory,
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
    expect(itineraryPageStory).not.toContain("args: Owner.args");
    expect(itineraryTemplateStory).toContain("@/src/shared/storybook/story-builders");
    expect(itineraryTemplateStory).not.toContain("...Owner.args");
    expect(itineraryTemplateStory).not.toContain("args: Owner.args");
    expect(storyBuilders).toContain("export function argsStory");
    expect(storyBuilders).toContain("export function ownerArgsStory");
    expect(storyBuilders).toContain("export function viewportStory");
    expect(sagittariusAppStory).not.toContain("defaultViewport:");
    [
      languageSwitchStory,
      uiPrimitivesStory,
      weatherForecastStripStory,
      weatherBriefingDrawerStory,
    ].forEach((storySource) => {
      expect(storySource).toContain("@/src/shared/storybook/story-builders");
      expect(storySource).not.toContain("defaultViewport:");
    });
    expect(itineraryPageStory).not.toContain("./itinerary-story-assertions");
    expect(itineraryPageStoryPlays).toContain("./support/itinerary-story-assertions");
    expect(itineraryTemplateStory).toContain("./ItineraryTemplate.stories.plays");
    expect(itineraryTemplateStory).not.toContain("./itinerary-story-assertions");
    expect(itineraryTemplateStoryPlays).toContain("./support/itinerary-story-assertions");
    [
      appShellStory,
      overviewPageStory,
      overviewTemplateStory,
      timelinePageStory,
      timelineTemplateStory,
      mapPageStory,
      mapTemplateStory,
    ].forEach((storySource) => {
      expect(storySource).toContain("@/src/shared/storybook/story-builders");
      expect(storySource).not.toContain("...Owner.args");
      expect(storySource).not.toContain("args: Owner.args");
    });
    expect(appShellStory).not.toContain("defaultViewport:");
    [homeLandingStory, aboutAppPageStory].forEach((storySource) => {
      expect(storySource).toContain("@/src/shared/storybook/story-builders");
      expect(storySource).not.toContain("defaultViewport:");
    });
    [contextRailStory, stopDialogStory].forEach((storySource) => {
      expect(storySource).toContain("@/src/shared/storybook/story-builders");
      expect(storySource).not.toContain("defaultViewport:");
    });
    expect(tripSettingsPageStory).toContain("@/src/shared/storybook/story-builders");
    expect(tripSettingsPageStory).not.toContain("defaultViewport:");
    expect(bookingsDocsPageStory).toContain("@/src/shared/storybook/story-builders");
    expect(bookingsDocsPageStory).not.toContain("defaultViewport:");
    expect(expensesPageStory).toContain("@/src/shared/storybook/story-builders");
    expect(expensesPageStory).not.toContain("defaultViewport:");
    expect(membersPageStory).toContain("@/src/shared/storybook/story-builders");
    expect(membersPageStory).not.toContain("defaultViewport:");
    expect(membersTemplateStory).toContain("@/src/shared/storybook/story-builders");
    expect(membersTemplateStory).not.toContain("...Owner.args");
    expect(photosPageStory).toContain("@/src/shared/storybook/story-builders");
    expect(photosPageStory).not.toContain("defaultViewport:");
    expect(tripJoinGateStory).toContain("@/src/shared/storybook/story-builders");
    expect(tripJoinGateStory).not.toContain("defaultViewport:");
  });
});
