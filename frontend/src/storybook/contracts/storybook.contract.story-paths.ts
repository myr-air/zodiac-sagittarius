export const appStoryPaths = {
  sagittariusApp: "app/storybook/SagittariusApp.stories.tsx",
} as const;

export const itineraryStoryPaths = {
  contextRail: "features/itinerary/stories/ContextRail.stories.tsx",
  itineraryPage: "features/itinerary/stories/ItineraryPage.stories.tsx",
  itineraryPagePlays: "features/itinerary/stories/ItineraryPage.stories.plays.ts",
  itineraryTemplate: "features/itinerary/stories/ItineraryTemplate.stories.tsx",
  itineraryTemplatePlays:
    "features/itinerary/stories/ItineraryTemplate.stories.plays.ts",
  mapPage: "features/itinerary/stories/workspace/MapPage.stories.tsx",
  mapTemplate: "features/itinerary/stories/workspace/MapTemplate.stories.tsx",
  overviewPage: "features/itinerary/stories/OverviewPage.stories.tsx",
  overviewTemplate:
    "features/itinerary/stories/workspace/OverviewTemplate.stories.tsx",
  stopDialog: "features/itinerary/stories/StopDialog.stories.tsx",
  timelinePage: "features/itinerary/stories/TimelinePage.stories.tsx",
  timelineTemplate: "features/itinerary/stories/TimelineTemplate.stories.tsx",
} as const;

export const workspaceStoryPaths = {
  appShell: "features/workspace/stories/AppShell.stories.tsx",
  appShellSupport: "features/workspace/stories/AppShell.stories.support.tsx",
  bookingsDocsPage:
    "features/workspace/pages/bookings-docs/storybook/BookingsDocsPage.stories.tsx",
  expensesPage:
    "features/workspace/pages/expenses/storybook/ExpensesPage.stories.tsx",
  membersPage:
    "features/workspace/pages/members/storybook/MembersPage.stories.tsx",
  membersTemplate:
    "features/workspace/pages/members/storybook/MembersTemplate.stories.tsx",
  photosPage:
    "features/workspace/pages/photos/storybook/TripPhotosPage.stories.tsx",
  tripSettingsPage:
    "features/workspace/pages/trip-settings/storybook/TripSettingsPage.stories.tsx",
} as const;

export type StorybookStoryPath =
  | (typeof appStoryPaths)[keyof typeof appStoryPaths]
  | (typeof itineraryStoryPaths)[keyof typeof itineraryStoryPaths]
  | (typeof workspaceStoryPaths)[keyof typeof workspaceStoryPaths];

export function srcStoryPath(path: StorybookStoryPath): `src/${StorybookStoryPath}` {
  return `src/${path}`;
}
