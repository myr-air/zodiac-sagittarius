import { noop } from "@/src/testing/storybook-actions";
import { seedTrip } from "@/src/trip/seed";
import type { AccountAccessPanelProps } from "../AccountAccessPanel";
import {
  accountStoryClient,
  accountStoryTripApiClient,
  trustedStorySession,
} from "./account-access-panel.stories.clients";

export {
  accountStoryClient,
  accountStoryTripApiClient,
  trustedStorySession,
} from "./account-access-panel.stories.clients";

type AccountAccessStoryArgs = AccountAccessPanelProps;

export const accountLoginStoryArgs = {
  accessMode: "account-login",
  accountClient: accountStoryClient,
  accountSession: null,
  trip: seedTrip,
  onAccountSessionChange: noop,
  onAuthenticated: noop,
  onTripChange: noop,
} satisfies AccountAccessStoryArgs;

export const portalDashboardStoryArgs = {
  ...accountLoginStoryArgs,
  accessMode: "account-portal",
  accountSession: trustedStorySession,
  portalSection: "dashboard",
  apiClient: accountStoryTripApiClient,
} satisfies AccountAccessStoryArgs;
