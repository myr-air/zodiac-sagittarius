import { workspaceTripShellBoundarySourcePaths } from "./workspace-source-boundaries.trip-shell-paths";
import { workspaceTripTestSupportBoundarySourcePaths } from "./workspace-source-boundaries.trip-test-support-paths";
import { workspaceTripImportBoundarySourcePaths } from "./workspace-source-boundaries.trip-import-paths";
import { workspaceTripSessionBoundarySourcePaths } from "./workspace-source-boundaries.trip-session-paths";
import { workspaceTripPlansBoundarySourcePaths } from "./workspace-source-boundaries.trip-plans-paths";
import { workspaceTripAdministrationBoundarySourcePaths } from "./workspace-source-boundaries.trip-administration-paths";
import { workspaceTripItineraryCommandBoundarySourcePaths } from "./workspace-source-boundaries.trip-itinerary-paths";
import { workspaceTripBookingCommandBoundarySourcePaths } from "./workspace-source-boundaries.trip-bookings-paths";
import { workspaceTripRecordCommandBoundarySourcePaths } from "./workspace-source-boundaries.trip-records-paths";
import { workspaceTripMediaExpenseBoundarySourcePaths } from "./workspace-source-boundaries.trip-media-expenses-paths";
import { workspaceTripContextBoundarySourcePaths } from "./workspace-source-boundaries.trip-contexts-paths";

export const workspaceTripBoundarySourcePaths = {
  ...workspaceTripShellBoundarySourcePaths,
  ...workspaceTripTestSupportBoundarySourcePaths,
  ...workspaceTripImportBoundarySourcePaths,
  ...workspaceTripSessionBoundarySourcePaths,
  ...workspaceTripPlansBoundarySourcePaths,
  ...workspaceTripAdministrationBoundarySourcePaths,
  ...workspaceTripItineraryCommandBoundarySourcePaths,
  ...workspaceTripBookingCommandBoundarySourcePaths,
  ...workspaceTripRecordCommandBoundarySourcePaths,
  ...workspaceTripMediaExpenseBoundarySourcePaths,
  ...workspaceTripContextBoundarySourcePaths,
} as const;
