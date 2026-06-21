import { describe, expect, it } from "vitest";
import { requiredAccessRouteStoryStates } from "./storybook.contract.required-states";
import {
  readProjectFile,
  storyText,
} from "./storybook.contract.test-support";

describe("Storybook access route contracts", () => {
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
      "storybook",
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
});
