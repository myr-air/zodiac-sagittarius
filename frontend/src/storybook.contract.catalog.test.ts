import { describe, expect, it } from "vitest";
import {
  requiredAppResponsiveStates,
  requiredGlobalStoryStates,
  requiredStoryCategories,
  requiredTemplateStates,
} from "./storybook.contract.required-states";
import { requiredPageStates } from "./storybook.contract.page-states";
import {
  expectStoryExports,
  readProjectFile,
  storyText,
} from "./storybook.contract.test-support";

describe("Storybook catalog contracts", () => {
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
});
