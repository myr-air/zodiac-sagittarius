import { frontendTripDomainAccessApiScaffoldPathsAbsent } from "./project-contract.frontend-trip-domain-access-api-absent-scaffold-paths";
import { frontendTripDomainCatalogSupportScaffoldPathsAbsent } from "./project-contract.frontend-trip-domain-catalog-support-absent-scaffold-paths";
import { frontendTripDomainCommerceRecordsScaffoldPathsAbsent } from "./project-contract.frontend-trip-domain-commerce-records-absent-scaffold-paths";
import { frontendTripDomainItineraryPlanningScaffoldPathsAbsent } from "./project-contract.frontend-trip-domain-itinerary-planning-absent-scaffold-paths";

export const frontendTripDomainScaffoldPathsAbsent = [
  ...frontendTripDomainAccessApiScaffoldPathsAbsent,
  ...frontendTripDomainItineraryPlanningScaffoldPathsAbsent,
  ...frontendTripDomainCommerceRecordsScaffoldPathsAbsent,
  ...frontendTripDomainCatalogSupportScaffoldPathsAbsent,
] as const;
