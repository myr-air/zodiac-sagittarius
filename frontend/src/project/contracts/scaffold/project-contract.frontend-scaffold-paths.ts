import { frontendFeatureScaffoldPathsPresent } from "./project-contract.frontend-feature-scaffold-paths";
import { frontendFoundationScaffoldPathsPresent } from "./project-contract.frontend-foundation-scaffold-paths";
import { frontendTestingScaffoldPathsPresent } from "./project-contract.frontend-testing-scaffold-paths";
import { frontendTripDomainScaffoldPathsPresent } from "./project-contract.frontend-trip-domain-scaffold-paths";
import { frontendWorkspaceScaffoldPathsPresent } from "./project-contract.frontend-workspace-scaffold-paths";

export const frontendScaffoldPathsPresent = [
  ...frontendFoundationScaffoldPathsPresent,
  ...frontendTestingScaffoldPathsPresent,
  ...frontendTripDomainScaffoldPathsPresent,
  ...frontendWorkspaceScaffoldPathsPresent,
  ...frontendFeatureScaffoldPathsPresent,
] as const;
