import { describe, expect, it } from "vitest";
import { requiredAccessRouteStoryStates } from "./storybook.contract.required-states";
import { appStoryPaths } from "./storybook.contract.story-paths";
import {
  readProjectFile,
  storyText,
} from "./storybook.contract.test-support";

describe("Storybook access route contracts", () => {
  const routeStoriesPath =
    "src/trip/workspace/sagittarius-app/support/storybook-route-stories.ts";

  it("documents split account and trip access routes", () => {
    const stories = storyText();
    const routeStories = readProjectFile(routeStoriesPath);
    requiredAccessRouteStoryStates.forEach((stateName) => {
      expect(stories).toContain(`export const ${stateName}`);
    });
    expect(routeStories).toContain('accessMode: "account-login"');
    expect(routeStories).toContain('accessMode: "account-register"');
    expect(routeStories).toContain('accessMode: "account-portal"');
    expect(routeStories).toContain('accessMode: "trip-access"');
    expect(routeStories).toContain('portalSection: "trips"');
    expect(routeStories).toContain('portalSection: "new-trip"');
    expect(routeStories).toContain('portalSection: "explorer"');
    expect(routeStories).toContain('portalSection: "todos"');
    expect(routeStories).toContain('portalSection: "vault"');
    expect(routeStories).toContain('portalSection: "settings"');
    expect(routeStories).toContain('portalSection: "sign-out"');
    expect(routeStories).toContain('initialJoinCode: seedTripJoinId');
    expect(routeStories).toContain("appRoutes.join()");
    expect(routeStories).toContain("appRoutes.join(seedTripJoinId)");
    expect(stories).toContain('title: "Pages/Account Access"');
    expect(stories).toContain("export const NewTripBuilder");
    expect(stories).toContain("export const NewTripMobile");
  });

  it("requires access-gated app stories to declare an explicit access mode", () => {
    const appStories = readProjectFile("src", ...appStoryPaths.sagittariusApp.split("/"));
    const routeStories = readProjectFile(routeStoriesPath);

    expect(appStories).toContain("appRouteStories");
    expect(routeStories).toContain("type ApiRouteStoryArgs = Pick<");
    expect(routeStories).toContain('| "accessMode"');
    expect(routeStories).toContain(
      '{ ...args, requireJoin: true, dataSource: "api" }',
    );
  });
});
