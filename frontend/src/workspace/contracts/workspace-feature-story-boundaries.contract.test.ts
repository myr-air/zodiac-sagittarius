import { describe, expect, it } from "vitest";
import { frontendRoot } from "../../project/contracts/project-contract.helpers";
import {
  expectSourceNotToContain,
  expectSourceToContain,
} from "./workspace-source-boundaries.assertions";
import { readWorkspaceBoundarySources } from "./workspace-source-boundaries.sources";

function expectUsesStoryBuilder(storySource: string) {
  expect(storySource).toContain("@/src/shared/storybook/story-builders");
}

function expectNoDefaultViewport(storySource: string) {
  expect(storySource).not.toContain("defaultViewport:");
}

function expectNoOwnerArgs(storySource: string) {
  expectSourceNotToContain(storySource, ["...Owner.args", "args: Owner.args"]);
}

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
    expectSourceNotToContain(itineraryStoryFixtures, [
      "buildItineraryStoryPathItems",
      "const stressPathItemsBase",
    ]);
    expectSourceToContain(itineraryStoryPathScenarios, [
      "./fixtures/itinerary-story-path-items",
      "./itinerary-story-path-options",
    ]);
    expectSourceToContain(itineraryStoryPathItems, [
      "./itinerary-story-alternative-items",
      "./itinerary-story-branch-items",
      "./itinerary-story-stress-items",
    ]);
    expect(itineraryStoryPathOptions).toContain("@/src/features/itinerary/testing");
    expect(itineraryStoryPathOptions).not.toContain("export const stressPathOptions");
    expectUsesStoryBuilder(itineraryPageStory);
    expect(itineraryPageStory).toContain("./ItineraryPage.stories.plays");
    expectSourceNotToContain(itineraryPageStory, [
      "function ownerArgsStory",
      "args: Owner.args",
    ]);
    expectUsesStoryBuilder(itineraryTemplateStory);
    expectNoOwnerArgs(itineraryTemplateStory);
    expectSourceToContain(storyBuilders, [
      "export function argsStory",
      "export function ownerArgsStory",
      "export function viewportStory",
    ]);
    expectNoDefaultViewport(sagittariusAppStory);
    [
      languageSwitchStory,
      uiPrimitivesStory,
      weatherForecastStripStory,
      weatherBriefingDrawerStory,
    ].forEach((storySource) => {
      expectUsesStoryBuilder(storySource);
      expectNoDefaultViewport(storySource);
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
      expectUsesStoryBuilder(storySource);
      expectNoOwnerArgs(storySource);
    });
    expectNoDefaultViewport(appShellStory);
    [homeLandingStory, aboutAppPageStory].forEach((storySource) => {
      expectUsesStoryBuilder(storySource);
      expectNoDefaultViewport(storySource);
    });
    [contextRailStory, stopDialogStory].forEach((storySource) => {
      expectUsesStoryBuilder(storySource);
      expectNoDefaultViewport(storySource);
    });
    [
      tripSettingsPageStory,
      bookingsDocsPageStory,
      expensesPageStory,
      membersPageStory,
      photosPageStory,
      tripJoinGateStory,
    ].forEach((storySource) => {
      expectUsesStoryBuilder(storySource);
      expectNoDefaultViewport(storySource);
    });
    expectUsesStoryBuilder(membersTemplateStory);
    expect(membersTemplateStory).not.toContain("...Owner.args");
  });
});
