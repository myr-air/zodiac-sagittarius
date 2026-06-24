import { frontendFeatureScaffoldPathsAbsent } from "./project-contract.frontend-feature-absent-scaffold-paths";
import { frontendFoundationScaffoldPathsAbsent } from "./project-contract.frontend-foundation-absent-scaffold-paths";
import { frontendTripDomainScaffoldPathsAbsent } from "./project-contract.frontend-trip-domain-absent-scaffold-paths";
import { frontendWorkspaceScaffoldPathsAbsent } from "./project-contract.frontend-workspace-absent-scaffold-paths";

export const frontendScaffoldPathsAbsent = [
  ...frontendFoundationScaffoldPathsAbsent,
  ...frontendFeatureScaffoldPathsAbsent,
  ...frontendTripDomainScaffoldPathsAbsent,
  ...frontendWorkspaceScaffoldPathsAbsent,
] as const;
