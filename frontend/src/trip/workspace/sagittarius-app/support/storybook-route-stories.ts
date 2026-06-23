import { appRoutes } from "@/src/routes/app-routes";
import type { PlanningView } from "@/src/trip/workspace/planning-view";
import {
  portalRoutes,
  tripRoutes,
} from "@/src/trip/workspace/sagittarius-app/support/route-patterns";
import {
  seedTripJoinId,
  storyTripId,
} from "@/src/trip/workspace/sagittarius-app/support/storybook-fixtures";
import {
  appRouteStory,
  type SagittariusAppStory,
} from "@/src/trip/workspace/sagittarius-app/support/storybook-story-builders";
import type { SagittariusAppProps } from "@/src/trip/workspace/sagittarius-app/types";

type ApiRouteStoryArgs = Pick<
  SagittariusAppProps,
  | "accessMode"
  | "initialJoinCode"
  | "initialView"
  | "portalSection"
  | "routeTripId"
>;

function apiRouteStory(
  args: ApiRouteStoryArgs,
  pathname: string,
): SagittariusAppStory {
  return appRouteStory(
    { ...args, requireJoin: true, dataSource: "api" },
    { pathname },
  );
}

function tripAccessViewStory(
  initialView: PlanningView,
  pathname: string,
): SagittariusAppStory {
  return apiRouteStory(
    { accessMode: "trip-access", initialView, routeTripId: storyTripId },
    pathname,
  );
}

export const apiJoinStory: SagittariusAppStory = {
  args: { accessMode: "trip-access", requireJoin: true, dataSource: "api" },
};
export const joinWithSeedCredentialsStory = apiRouteStory(
  { accessMode: "trip-access", initialJoinCode: seedTripJoinId },
  appRoutes.join(),
);
export const publicEntryStory = apiRouteStory(
  { accessMode: "account-login" },
  appRoutes.home(),
);
export const accountLoginStory = apiRouteStory(
  { accessMode: "account-login" },
  appRoutes.access("sign-in"),
);
export const accountRegisterStory = apiRouteStory(
  { accessMode: "account-register" },
  appRoutes.access("register"),
);
export const accountPortalStory = apiRouteStory(
  { accessMode: "account-portal" },
  portalRoutes.base,
);
export const accountPortalMyTripsStory = apiRouteStory(
  { accessMode: "account-portal", portalSection: "trips" },
  portalRoutes.myTrips,
);
export const accountPortalNewTripStory = apiRouteStory(
  { accessMode: "account-portal", portalSection: "new-trip" },
  portalRoutes.newTrip,
);
export const accountPortalExplorerStory = apiRouteStory(
  { accessMode: "account-portal", portalSection: "explorer" },
  portalRoutes.explorer,
);
export const accountPortalToDosStory = apiRouteStory(
  { accessMode: "account-portal", portalSection: "todos" },
  portalRoutes.toDos,
);
export const accountPortalVaultStory = apiRouteStory(
  { accessMode: "account-portal", portalSection: "vault" },
  portalRoutes.vault,
);
export const accountPortalSettingsStory = apiRouteStory(
  { accessMode: "account-portal", portalSection: "settings" },
  portalRoutes.settings,
);
export const accountPortalSignOutStory = apiRouteStory(
  { accessMode: "account-portal", portalSection: "sign-out" },
  portalRoutes.signOut,
);
export const accountTripsStory = apiRouteStory(
  { accessMode: "account-portal", portalSection: "trips" },
  tripRoutes.tripsBase,
);
export const accountNewTripStory = apiRouteStory(
  { accessMode: "account-login" },
  tripRoutes.tripsNew,
);
export const tripAccessStory = apiRouteStory(
  { accessMode: "trip-access" },
  appRoutes.join(),
);
export const tripAccessWithJoinCodeStory = apiRouteStory(
  { accessMode: "trip-access", initialJoinCode: seedTripJoinId },
  appRoutes.join(seedTripJoinId),
);
export const tripOverviewAccessStory = tripAccessViewStory(
  "overview",
  tripRoutes.base(storyTripId),
);
export const tripItineraryAccessStory = tripAccessViewStory(
  "itinerary",
  tripRoutes.itinerary(storyTripId),
);
export const tripMapAccessStory = tripAccessViewStory(
  "map",
  tripRoutes.map(storyTripId),
);
export const tripTimelineAccessStory = tripAccessViewStory(
  "timeline",
  tripRoutes.timeline(storyTripId),
);
export const tripMembersAccessStory = tripAccessViewStory(
  "members",
  tripRoutes.members(storyTripId),
);

export const appRouteStories = {
  accountLogin: accountLoginStory,
  accountNewTrip: accountNewTripStory,
  accountPortal: accountPortalStory,
  accountPortalExplorer: accountPortalExplorerStory,
  accountPortalMyTrips: accountPortalMyTripsStory,
  accountPortalNewTrip: accountPortalNewTripStory,
  accountPortalSettings: accountPortalSettingsStory,
  accountPortalSignOut: accountPortalSignOutStory,
  accountPortalToDos: accountPortalToDosStory,
  accountPortalVault: accountPortalVaultStory,
  accountRegister: accountRegisterStory,
  accountTrips: accountTripsStory,
  apiJoin: apiJoinStory,
  joinWithSeedCredentials: joinWithSeedCredentialsStory,
  publicEntry: publicEntryStory,
  tripAccess: tripAccessStory,
  tripAccessWithJoinCode: tripAccessWithJoinCodeStory,
  tripItineraryAccess: tripItineraryAccessStory,
  tripMapAccess: tripMapAccessStory,
  tripMembersAccess: tripMembersAccessStory,
  tripOverviewAccess: tripOverviewAccessStory,
  tripTimelineAccess: tripTimelineAccessStory,
} as const;
