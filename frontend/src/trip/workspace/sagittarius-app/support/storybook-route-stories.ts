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

export const appRouteStories = {
  accountLogin: apiRouteStory(
    { accessMode: "account-login" },
    appRoutes.access("sign-in"),
  ),
  accountNewTrip: apiRouteStory(
    { accessMode: "account-login" },
    tripRoutes.tripsNew,
  ),
  accountPortal: apiRouteStory(
    { accessMode: "account-portal" },
    portalRoutes.base,
  ),
  accountPortalExplorer: apiRouteStory(
    { accessMode: "account-portal", portalSection: "explorer" },
    portalRoutes.explorer,
  ),
  accountPortalMyTrips: apiRouteStory(
    { accessMode: "account-portal", portalSection: "trips" },
    portalRoutes.myTrips,
  ),
  accountPortalNewTrip: apiRouteStory(
    { accessMode: "account-portal", portalSection: "new-trip" },
    portalRoutes.newTrip,
  ),
  accountPortalSettings: apiRouteStory(
    { accessMode: "account-portal", portalSection: "settings" },
    portalRoutes.settings,
  ),
  accountPortalSignOut: apiRouteStory(
    { accessMode: "account-portal", portalSection: "sign-out" },
    portalRoutes.signOut,
  ),
  accountPortalToDos: apiRouteStory(
    { accessMode: "account-portal", portalSection: "todos" },
    portalRoutes.toDos,
  ),
  accountPortalVault: apiRouteStory(
    { accessMode: "account-portal", portalSection: "vault" },
    portalRoutes.vault,
  ),
  accountRegister: apiRouteStory(
    { accessMode: "account-register" },
    appRoutes.access("register"),
  ),
  accountTrips: apiRouteStory(
    { accessMode: "account-portal", portalSection: "trips" },
    tripRoutes.tripsBase,
  ),
  apiJoin: {
    args: { accessMode: "trip-access", requireJoin: true, dataSource: "api" },
  },
  joinWithSeedCredentials: apiRouteStory(
    { accessMode: "trip-access", initialJoinCode: seedTripJoinId },
    appRoutes.join(),
  ),
  publicEntry: apiRouteStory(
    { accessMode: "account-login" },
    appRoutes.home(),
  ),
  tripAccess: apiRouteStory(
    { accessMode: "trip-access" },
    appRoutes.join(),
  ),
  tripAccessWithJoinCode: apiRouteStory(
    { accessMode: "trip-access", initialJoinCode: seedTripJoinId },
    appRoutes.join(seedTripJoinId),
  ),
  tripItineraryAccess: tripAccessViewStory(
    "itinerary",
    tripRoutes.itinerary(storyTripId),
  ),
  tripMapAccess: tripAccessViewStory("map", tripRoutes.map(storyTripId)),
  tripMembersAccess: tripAccessViewStory(
    "members",
    tripRoutes.members(storyTripId),
  ),
  tripOverviewAccess: tripAccessViewStory(
    "overview",
    tripRoutes.base(storyTripId),
  ),
  tripTimelineAccess: tripAccessViewStory(
    "timeline",
    tripRoutes.timeline(storyTripId),
  ),
} as const satisfies Record<string, SagittariusAppStory>;

export const {
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
} = appRouteStories;
