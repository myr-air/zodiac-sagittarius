import { existsSync, readdirSync, readFileSync } from "node:fs";
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

function expectStoryExports(file: string, stateNames: string[]) {
  const story = readFileSync(join("src", file), "utf8");

  stateNames.forEach((stateName) => {
    expect(story, `${file} should export ${stateName}`).toContain(`export const ${stateName}`);
  });
}

describe("Storybook template catalog", () => {
  it("contains design system, template, and page story categories", () => {
    const stories = storyText();
    [
      "Design System/Buttons",
      "Design System/Badges",
      "Design System/Context Rail",
      "Design System/Date Time Pickers",
      "Design System/Language Switch",
      "Design System/Page Header",
      "Design System/People Panel",
      "Design System/Suggestion Panel",
      "Design System/Travel Motifs",
      "Design System/Weather Briefing Drawer",
      "Design System/Weather Forecast Strip",
      "Pages/Account Access",
      "Sagittarius/App",
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
      "Pages/Photos",
      "Pages/Expenses",
      "Pages/Bookings & Docs",
      "Pages/Trip Settings",
      "Pages/Home Landing",
      "Pages/About",
      "Pages/Stop Dialog",
      "Pages/Trip Join Gate",
    ].forEach((title) => expect(stories).toContain(`title: "${title}"`));
  });

  it("documents role and density states", () => {
    const stories = storyText();
    ["Owner", "OwnerThai", "Traveler", "Viewer", "Empty", "Dense", "Mobile", "TabletItinerary", "MobileItinerary", "Desktop1024", "Desktop1440", "TableOverflow"].forEach((stateName) => {
      expect(stories).toContain(`export const ${stateName}`);
    });
  });

  it("documents page-level role, density, and viewport states per cockpit page", () => {
    const requiredPageStates: Array<[string, string[]]> = [
      ["features/itinerary/stories/OverviewPage.stories.tsx", ["Owner", "OwnerThai", "Traveler", "Viewer", "Dense", "Empty", "AddTaskDialogOpen", "Tablet", "Desktop1024", "Desktop1440", "Mobile"]],
      ["features/itinerary/stories/ItineraryPage.stories.tsx", ["Owner", "OwnerThai", "Traveler", "Viewer", "Dense", "Empty", "OverlapConflictWarning", "PlanAExample", "PlanABAlternatives", "BranchGraph", "RequestedPlanExample", "StressPaths", "TableOverflow", "Tablet", "Desktop1024", "Desktop1440", "Mobile", "MobileViewer"]],
      ["features/itinerary/stories/TimelinePage.stories.tsx", ["Owner", "OwnerThai", "Traveler", "Viewer", "Dense", "Empty", "Tablet", "Desktop1024", "Desktop1440", "Mobile"]],
      ["features/itinerary/stories/workspace/MapPage.stories.tsx", ["Owner", "OwnerThai", "Traveler", "Viewer", "Dense", "Empty", "LiveMapLoading", "LiveMapFailure", "Tablet", "Desktop1024", "Desktop1440", "Mobile"]],
      ["features/workspace/pages/members/MembersPage.stories.tsx", ["Owner", "OwnerThai", "Traveler", "Viewer", "Dense", "Empty", "Tablet", "Desktop1024", "Desktop1440", "Mobile"]],
      ["features/workspace/pages/expenses/ExpensesPage.stories.tsx", ["Owner", "OwnerThai", "Traveler", "Viewer", "Dense", "Empty", "AddExpenseDialogOpen", "FilteredLedger", "Tablet", "Desktop1024", "Desktop1440", "Mobile"]],
      ["features/workspace/pages/photos/TripPhotosPage.stories.tsx", ["Owner", "OwnerThai", "Traveler", "Viewer", "Dense", "Empty", "AddAlbumDialogOpen", "CoverStates", "Tablet", "Desktop1024", "Desktop1440", "Mobile"]],
      ["features/workspace/pages/bookings-docs/BookingsDocsPage.stories.tsx", ["Owner", "OwnerThai", "Traveler", "Viewer", "Dense", "Empty", "AddBookingDialogOpen", "Tablet", "Desktop1024", "Desktop1440", "Mobile"]],
      ["features/workspace/pages/trip-settings/TripSettingsPage.stories.tsx", ["Owner", "Traveler", "Viewer", "Thai", "Tablet", "Desktop1024", "Desktop1440", "Mobile"]],
      ["features/account/components/trip-join-gate/TripJoinGate.stories.tsx", ["RoomCredentials", "TripAccess", "SelectIdentity", "Thai", "Tablet", "Mobile", "Desktop1024", "Desktop1440"]],
      ["features/itinerary/stories/StopDialog.stories.tsx", ["Create", "Edit", "AmbiguousPlace", "TransportationForm", "FoodForm", "StayForm", "ShoppingForm", "Mobile", "Tablet", "Desktop1024", "Desktop1440", "Thai"]],
      ["features/public-site/pages/about/AboutAppPage.stories.tsx", ["Ready", "ApiUnavailable", "Thai", "Mobile", "Tablet", "Desktop1024", "Desktop1440"]],
      ["features/itinerary/stories/ContextRail.stories.tsx", ["NotesOpen", "BookingTab", "SuggestionsTab", "TripExpensesOnly", "ReadOnlyTraveler", "Closed", "Mobile", "Tablet", "Thai", "Desktop1024", "Desktop1440"]],
      ["shared/components/people-panel/PeoplePanel.stories.tsx", ["Manager", "ReadOnly", "Empty"]],
      ["shared/components/suggestion-panel/SuggestionPanel.stories.tsx", ["Default", "Thai", "Empty", "ConflictedHeavy"]],
      ["shared/components/date-time-pickers/DateTimePickers.stories.tsx", ["TimePicker", "DatePicker", "DateTimePicker", "Disabled", "Mobile", "Tablet", "Thai", "Desktop1024", "Desktop1440"]],
      ["shared/components/weather/WeatherBriefingDrawer.stories.tsx", ["OrganizerDrawer", "TravelerDrawer", "MobileSheet", "PartialData"]],
      ["shared/components/weather/WeatherForecastStrip.stories.tsx", ["AtmosphericGlass", "MobileOverflow", "Thai", "Empty"]],
      ["features/public-site/pages/home/HomeLanding.stories.tsx", ["PixelPerfect", "Thai", "Tablet", "Mobile", "Desktop1024", "Desktop1440"]],
      ["features/account/components/account-access-panel/AccountAccessPanel.stories.tsx", ["AccountLogin", "AccountRegister", "AccountLoginThai", "TripAccess", "PortalDashboard", "NewTripBuilder", "NewTripMobile", "AccountLoginTablet", "AccountLoginDesktop1024", "AccountLoginDesktop1440", "TripAccessTablet", "TripAccessDesktop1024", "TripAccessDesktop1440", "NewTripTablet", "NewTripDesktop1024", "NewTripDesktop1440"]],
    ];

    requiredPageStates.forEach(([file, stateNames]) => {
      expectStoryExports(file, stateNames);
    });
  });

  it("documents top-level cockpit owner, traveler, and viewer roles", () => {
    const appStories = readFileSync(join("src", "app", "SagittariusApp.stories.tsx"), "utf8");

    ["Owner", "OwnerThai", "Traveler", "Viewer", "Dense", "Empty"].forEach((stateName) => {
      expect(appStories).toContain(`export const ${stateName}`);
    });
    expect(appStories).toContain("initialMemberId: travelerMemberId");
    expect(appStories).toContain("initialMemberId: viewerMemberId");
  });

  it("documents app-level responsive stories for every primary cockpit view", () => {
    expectStoryExports("app/SagittariusApp.stories.tsx", [
      "TabletOverview",
      "MobileOverview",
      "Desktop1024Overview",
      "Desktop1440Overview",
      "TabletItinerary",
      "MobileItinerary",
      "Desktop1024Itinerary",
      "Desktop1440Itinerary",
      "TabletTimeline",
      "MobileTimeline",
      "Desktop1024Timeline",
      "Desktop1440Timeline",
      "TabletMap",
      "MobileMap",
      "Desktop1024Map",
      "Desktop1440Map",
      "TabletMembers",
      "MobileMembers",
      "Desktop1024Members",
      "Desktop1440Members",
      "TabletExpenses",
      "MobileExpenses",
      "Desktop1024Expenses",
      "Desktop1440Expenses",
      "TabletBookings",
      "MobileBookings",
      "Desktop1024Bookings",
      "Desktop1440Bookings",
      "TabletPhotos",
      "MobilePhotos",
      "Desktop1024Photos",
      "Desktop1440Photos",
      "TabletSettings",
      "MobileSettings",
      "Desktop1024Settings",
      "Desktop1440Settings",
    ]);
  });

  it("documents structural template states for shell and reusable cockpit views", () => {
    const requiredTemplateStates: Array<[string, string[]]> = [
      ["features/workspace/stories/AppShell.stories.tsx", ["Owner", "Traveler", "Viewer", "Mobile", "Tablet", "OwnerThai"]],
      ["features/itinerary/stories/workspace/OverviewTemplate.stories.tsx", ["Owner", "Traveler", "OwnerThai", "Viewer", "Empty", "Dense"]],
      ["features/itinerary/stories/ItineraryTemplate.stories.tsx", ["Owner", "OwnerThai", "Viewer", "Traveler", "Dense", "HierarchyBlocks", "HierarchyWarnings", "TableOverflow", "BranchGraph", "PlanAExample", "PlanABAlternatives", "RequestedPlanExample", "StressPaths"]],
      ["features/itinerary/stories/TimelineTemplate.stories.tsx", ["Owner", "OwnerThai", "Traveler", "Viewer", "Dense", "Empty"]],
      ["features/itinerary/stories/workspace/MapTemplate.stories.tsx", ["Owner", "OwnerThai", "Traveler", "Viewer", "Dense", "Empty"]],
      ["features/workspace/pages/members/MembersTemplate.stories.tsx", ["Owner", "OwnerThai", "Traveler", "Viewer", "Dense", "Empty"]],
    ];

    requiredTemplateStates.forEach(([file, stateNames]) => {
      expectStoryExports(file, stateNames);
    });
  });

  it("keeps viewport and antigravity UX QA entry points available", () => {
    const preview = readFileSync(join(".storybook", "preview.ts"), "utf8");
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as { scripts?: Record<string, string> };
    const stories = storyText();

    ["mobile320", "tablet768", "desktop1024", "desktop1440"].forEach((viewportName) => {
      expect(preview).toContain(viewportName);
    });
    expect(stories).not.toContain('defaultViewport: "mobile1"');
    expect(packageJson.scripts?.["test:storybook:agy"]).toBe("bun run scripts/run-storybook-agy-ux-qa.ts");
    expect(existsSync(join("scripts", "run-storybook-agy-ux-qa.ts"))).toBe(true);
    expect(existsSync(join("..", "docs", "storybook-ux-ui-qa.md"))).toBe(true);
  });

  it("wraps stories in bilingual i18n controls with English as the default", () => {
    const preview = readFileSync(join(".storybook", "preview.ts"), "utf8");
    const stories = storyText();

    expect(preview).toContain("I18nProvider");
    expect(preview).toContain("globalTypes");
    expect(preview).toContain("defaultValue: defaultLocale");
    expect(stories).toContain('parameters: { locale: "th" }');
  });

  it("documents split account and trip access routes", () => {
    const stories = storyText();
    [
      "PublicEntry",
      "AccountLogin",
      "AccountRegister",
      "AccountPortal",
      "AccountPortalMyTrips",
      "AccountPortalExplorer",
      "AccountPortalToDos",
      "AccountPortalVault",
      "AccountPortalSettings",
      "AccountPortalSignOut",
      "AccountTrips",
      "AccountNewTrip",
      "TripAccess",
      "JoinWithSeedCredentials",
      "TripAccessWithJoinCode",
      "TripOverviewAccess",
      "TripItineraryAccess",
      "TripMapAccess",
      "TripTimelineAccess",
      "TripMembersAccess",
    ].forEach((stateName) => {
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
    const appStories = readFileSync(join("src", "app", "SagittariusApp.stories.tsx"), "utf8");
    const gatedStoryLines = appStories.split("\n").filter((line) => line.includes("requireJoin: true"));

    expect(gatedStoryLines.length).toBeGreaterThan(0);
    gatedStoryLines.forEach((line) => {
      expect(line).toContain("accessMode:");
    });
  });
});
