import { frontendAccountTripWizardScaffoldPathsAbsent } from "./project-contract.frontend-account-trip-wizard-absent-scaffold-paths";
import { frontendAccountEmailLoginScaffoldPathsAbsent } from "./project-contract.frontend-account-email-login-absent-scaffold-paths";
import { frontendAccountTripJoinGateScaffoldPathsAbsent } from "./project-contract.frontend-account-trip-join-gate-absent-scaffold-paths";
import { frontendAccountPortalScaffoldPathsAbsent } from "./project-contract.frontend-account-portal-absent-scaffold-paths";
import { frontendAccountAuthScaffoldPathsAbsent } from "./project-contract.frontend-account-auth-absent-scaffold-paths";
import { frontendAccountCoreScaffoldPathsAbsent } from "./project-contract.frontend-account-core-absent-scaffold-paths";

export const frontendAccountFeatureScaffoldPathsAbsent = [
  ...frontendAccountTripWizardScaffoldPathsAbsent,
  ...frontendAccountEmailLoginScaffoldPathsAbsent,
  ...frontendAccountTripJoinGateScaffoldPathsAbsent,
  ...frontendAccountPortalScaffoldPathsAbsent,
  ...frontendAccountAuthScaffoldPathsAbsent,
  ...frontendAccountCoreScaffoldPathsAbsent,
] as const;
