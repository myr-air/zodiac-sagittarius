import { describe, expect, it } from "vitest";
import { buildPrefixedPathScenarioItems } from "./itinerary-story-path-scenarios";

describe("itinerary story path scenarios", () => {
  it("builds prefixed scenario item sets for story variants", () => {
    const scenarios = buildPrefixedPathScenarioItems("page");

    expect(scenarios.branchGraphItems[0]).toMatchObject({
      id: "page-graph-main",
    });
    expect(scenarios.planAExampleItems[0].id).toMatch(/^page-/);
    expect(scenarios.planABAlternativeItems[0].id).toMatch(/^page-/);
    expect(scenarios.requestedPlanExampleItems[0].id).toMatch(/^page-/);
    expect(scenarios.stressPathItems[0].id).toMatch(/^page-/);
    expect(scenarios.windowOnlyDurationItems[0].id).toMatch(/^page-/);
  });

  it("keeps prefixed path group ids aligned with item ids", () => {
    const scenarios = buildPrefixedPathScenarioItems("story");
    const groupedItem = scenarios.planABAlternativeItems.find(
      (item) => item.pathGroupId,
    );

    expect(groupedItem?.id).toMatch(/^story-/);
    expect(groupedItem?.pathGroupId).toMatch(/^story-/);
  });
});
