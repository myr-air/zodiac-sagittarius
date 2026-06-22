import { frontendTripDomainAccessApiScaffoldPathsPresent } from "./project-contract.frontend-trip-domain-access-api-scaffold-paths";
import { frontendTripDomainCatalogSupportScaffoldPathsPresent } from "./project-contract.frontend-trip-domain-catalog-support-scaffold-paths";
import { frontendTripDomainCommerceRecordsScaffoldPathsPresent } from "./project-contract.frontend-trip-domain-commerce-records-scaffold-paths";
import { frontendTripDomainItineraryPlanningScaffoldPathsPresent } from "./project-contract.frontend-trip-domain-itinerary-planning-scaffold-paths";

export const frontendTripDomainScaffoldPathsPresent = [
  ...frontendTripDomainAccessApiScaffoldPathsPresent,
  ...frontendTripDomainItineraryPlanningScaffoldPathsPresent,
  ...frontendTripDomainCommerceRecordsScaffoldPathsPresent,
  ...frontendTripDomainCatalogSupportScaffoldPathsPresent,
] as const;
