import { requiredAccessPageStates } from "./storybook.contract.access-page-states";
import { requiredItineraryPageStates } from "./storybook.contract.itinerary-page-states";
import { requiredSupportingPageStates } from "./storybook.contract.supporting-page-states";
import { requiredWorkspacePageStates } from "./storybook.contract.workspace-page-states";

export const requiredPageStates: Array<[string, string[]]> = [
  ...requiredItineraryPageStates,
  ...requiredWorkspacePageStates,
  ...requiredAccessPageStates,
  ...requiredSupportingPageStates,
];
