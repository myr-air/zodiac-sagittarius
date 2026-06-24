import type { StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import type { AccountAccessPanel } from "../AccountAccessPanel";

type AccountAccessPanelPlay = NonNullable<StoryObj<typeof AccountAccessPanel>["play"]>;

export const accountLoginPlay: AccountAccessPanelPlay = async ({ canvas }) => {
  await expect(canvas.getByRole("main", { name: /Account sign in/i })).toBeVisible();
  await expect(canvas.getByLabelText(/Email/i)).toHaveAttribute("autocomplete", "username");
};

export const accountRegisterPlay: AccountAccessPanelPlay = async ({ canvas }) => {
  await expect(canvas.getByRole("main", { name: /Account register/i })).toBeVisible();
  await expect(canvas.getByRole("button", { name: /Set password and continue/i })).toBeDisabled();
};

export const accountLoginThaiPlay: AccountAccessPanelPlay = async ({ canvas }) => {
  await expect(canvas.getByRole("main", { name: /Account sign in/i })).toBeVisible();
  await expect(canvas.getAllByText(/อีเมล \*/i).length).toBeGreaterThan(0);
  await expect(canvas.getByLabelText(/อีเมล/i)).toHaveAttribute("autocomplete", "username");
  await expect(canvas.getByRole("button", { name: /เข้า account/i })).toBeDisabled();
};

export const tripAccessPlay: AccountAccessPanelPlay = async ({ canvas }) => {
  await expect(canvas.getByRole("main", { name: /Trip access/i })).toBeVisible();
  await expect(canvas.getByRole("heading", { name: /Enter trip room/i })).toBeVisible();
};

export const portalDashboardPlay: AccountAccessPanelPlay = async ({ canvas }) => {
  await expect(await canvas.findByText(/User data stats and session status/i)).toBeVisible();
  await expect(await canvas.findByRole("navigation", { name: /Portal navigation/i })).toBeVisible();
};

export const newTripBuilderPlay: AccountAccessPanelPlay = async ({ canvas }) => {
  await expect(await canvas.findByLabelText(/Trip name/i)).toBeVisible();
  await expect(await canvas.findByRole("region", { name: /Live trip preview/i })).toHaveClass(
    "trip-live-preview",
  );
};

export const newTripMobilePlay: AccountAccessPanelPlay = async ({ canvas }) => {
  await expect(await canvas.findByLabelText(/Trip name/i)).toBeVisible();
  await expect(canvas.getByRole("main", { name: /Account portal/i })).toHaveClass(
    "account-page--portal-new-trip",
  );
};
