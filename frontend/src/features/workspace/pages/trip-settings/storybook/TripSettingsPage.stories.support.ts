import { expect } from "storybook/test";
import { asyncNoop } from "@/src/testing/storybook-actions";
import { seedTrip } from "@/src/trip/seed";
import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import type { TripSettingsPage } from "../TripSettingsPage";

type TripSettingsPageStoryArgs = Parameters<typeof TripSettingsPage>[0];

export const planImpactTrip = {
  ...seedTrip,
  endDate: seedTrip.startDate,
};

export const tripSettingsOwnerStoryArgs = {
  canEdit: true,
  currentMember: tripFixture.currentMembers.owner,
  trip: seedTrip,
  onSave: asyncNoop,
} satisfies TripSettingsPageStoryArgs;

export const tripSettingsViewerStoryArgs = {
  ...tripSettingsOwnerStoryArgs,
  canEdit: false,
  currentMember: tripFixture.currentMembers.viewer,
} satisfies TripSettingsPageStoryArgs;

export const tripSettingsTravelerStoryArgs = {
  ...tripSettingsOwnerStoryArgs,
  canEdit: false,
  currentMember: tripFixture.currentMembers.traveler,
} satisfies TripSettingsPageStoryArgs;

export const tripSettingsPlanImpactStoryArgs = {
  ...tripSettingsOwnerStoryArgs,
  trip: planImpactTrip,
} satisfies TripSettingsPageStoryArgs;

export async function expectSettingsResponsiveContract(canvasElement: HTMLElement) {
  await expect(canvasElement.querySelector(".content-grid")).toHaveClass("content-grid", "max-[920px]:grid-cols-1");
  await expect(canvasElement.querySelector(".field-grid")).toHaveClass("field-grid", "max-[767px]:grid-cols-1");
}
