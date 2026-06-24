import { workspaceItineraryFeatureBoundarySourcePaths } from "./workspace-source-boundaries.feature-itinerary-paths";
import { workspacePagesFeatureBoundarySourcePaths } from "./workspace-source-boundaries.feature-workspace-pages-paths";
import { workspaceAccountFeatureBoundarySourcePaths } from "./workspace-source-boundaries.feature-account-paths";

export const workspaceFeatureBoundarySourcePaths = {
  ...workspaceItineraryFeatureBoundarySourcePaths,
  ...workspacePagesFeatureBoundarySourcePaths,
  ...workspaceAccountFeatureBoundarySourcePaths,
} as const;
