import type { StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import type { TripSettingsPage } from "../TripSettingsPage";
import { expectSettingsResponsiveContract } from "./TripSettingsPage.stories.support";

type TripSettingsPagePlay = NonNullable<StoryObj<typeof TripSettingsPage>["play"]>;

export const ownerPlay: TripSettingsPagePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /Trip settings/i })).toHaveClass("trip-settings-page");
  await expect(canvas.getByRole("form", { name: /Trip details/i })).toBeVisible();
  await expect(canvas.getByRole("button", { name: /Save changes/i })).toBeEnabled();
};

export const viewerPlay: TripSettingsPagePlay = async ({ canvas }) => {
  await expect(canvas.getByText(/Only owners and organizers can edit trip settings/i)).toBeVisible();
  await expect(canvas.getByRole("button", { name: /Save changes/i })).toBeDisabled();
};

export const thaiPlay: TripSettingsPagePlay = async ({ canvas, canvasElement }) => {
  await expectSettingsResponsiveContract(canvasElement);
  await expect(canvas.getByRole("region", { name: /ตั้งค่าทริป/i })).toBeVisible();
  await expect(canvas.getByLabelText(/ชื่อทริป/i)).toBeVisible();
  await expect(canvas.getByRole("button", { name: /บันทึกการเปลี่ยนแปลง/i })).toBeEnabled();
};

export const planImpactWarningPlay: TripSettingsPagePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /Trip settings/i })).toHaveClass("trip-settings-page");
  await expect(canvas.getByRole("region", { name: /Plan impact/i })).toBeVisible();
  await expect(canvas.getByText(/planned stops will sit outside the new trip dates/i)).toBeVisible();
};

export const responsivePlay: TripSettingsPagePlay = async ({ canvasElement }) => {
  await expectSettingsResponsiveContract(canvasElement);
};
