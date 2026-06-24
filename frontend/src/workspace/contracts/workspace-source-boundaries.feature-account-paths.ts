import { workspaceAccountShellBoundarySourcePaths } from "./workspace-source-boundaries.feature-account-shell-paths";
import { workspaceAccountPortalBoundarySourcePaths } from "./workspace-source-boundaries.feature-account-portal-paths";
import { workspaceAccountTripWizardBoundarySourcePaths } from "./workspace-source-boundaries.feature-account-trip-wizard-paths";
import { workspaceAccountAuthEmailBoundarySourcePaths } from "./workspace-source-boundaries.feature-account-auth-email-paths";
import { workspaceAccountTripJoinBoundarySourcePaths } from "./workspace-source-boundaries.feature-account-trip-join-paths";
import { workspaceAccountStoryTestBoundarySourcePaths } from "./workspace-source-boundaries.feature-account-story-test-paths";

export const workspaceAccountFeatureBoundarySourcePaths = {
  ...workspaceAccountShellBoundarySourcePaths,
  ...workspaceAccountPortalBoundarySourcePaths,
  ...workspaceAccountTripWizardBoundarySourcePaths,
  ...workspaceAccountAuthEmailBoundarySourcePaths,
  ...workspaceAccountTripJoinBoundarySourcePaths,
  ...workspaceAccountStoryTestBoundarySourcePaths,
} as const;
