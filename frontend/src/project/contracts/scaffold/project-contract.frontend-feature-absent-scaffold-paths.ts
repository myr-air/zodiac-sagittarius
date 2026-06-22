import { frontendAccountFeatureScaffoldPathsAbsent } from "./project-contract.frontend-account-feature-absent-scaffold-paths";
import { frontendItineraryFeatureScaffoldPathsAbsent } from "./project-contract.frontend-itinerary-feature-absent-scaffold-paths";
import { frontendPublicSiteFeatureScaffoldPathsAbsent } from "./project-contract.frontend-public-site-feature-absent-scaffold-paths";
import { frontendWorkspaceFeatureScaffoldPathsAbsent } from "./project-contract.frontend-workspace-feature-absent-scaffold-paths";

export const frontendFeatureScaffoldPathsAbsent = [
  ...frontendWorkspaceFeatureScaffoldPathsAbsent,
  ...frontendAccountFeatureScaffoldPathsAbsent,
  ...frontendPublicSiteFeatureScaffoldPathsAbsent,
  ...frontendItineraryFeatureScaffoldPathsAbsent,
] as const;
