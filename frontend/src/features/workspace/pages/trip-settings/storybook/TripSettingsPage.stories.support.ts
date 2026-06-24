import { expect } from "storybook/test";
import { asyncNoop } from "@/src/testing/storybook-actions";
import {
  ownerStoryMember,
  storyTrip,
  travelerStoryMember,
  viewerStoryMember,
} from "@/src/trip/testing/fixtures/trip-story-fixtures";
import type { TripSettingsPageProps } from "../TripSettingsPage";

type TripSettingsPageStoryArgs = TripSettingsPageProps;

export const planImpactTrip = {
  ...storyTrip,
  endDate: storyTrip.startDate,
};

export const tripSettingsOwnerStoryArgs = {
  canEdit: true,
  currentMember: ownerStoryMember,
  trip: storyTrip,
  onSave: asyncNoop,
} satisfies TripSettingsPageStoryArgs;

export const tripSettingsViewerStoryArgs = {
  ...tripSettingsOwnerStoryArgs,
  canEdit: false,
  currentMember: viewerStoryMember,
} satisfies TripSettingsPageStoryArgs;

export const tripSettingsTravelerStoryArgs = {
  ...tripSettingsOwnerStoryArgs,
  canEdit: false,
  currentMember: travelerStoryMember,
} satisfies TripSettingsPageStoryArgs;

export const tripSettingsPlanImpactStoryArgs = {
  ...tripSettingsOwnerStoryArgs,
  trip: planImpactTrip,
} satisfies TripSettingsPageStoryArgs;

export async function expectSettingsResponsiveContract(canvasElement: HTMLElement) {
  await expect(canvasElement.querySelector(".content-grid")).toHaveClass("content-grid", "max-[920px]:grid-cols-1");
  await expect(canvasElement.querySelector(".field-grid")).toHaveClass("field-grid", "max-[767px]:grid-cols-1");
}
