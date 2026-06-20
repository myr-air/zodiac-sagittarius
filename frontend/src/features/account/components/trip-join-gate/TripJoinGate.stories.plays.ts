import type { StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import type { TripJoinGate } from "./TripJoinGate";
import { expectJoinResponsiveContract } from "./TripJoinGate.stories.support";

type TripJoinGatePlay = NonNullable<StoryObj<typeof TripJoinGate>["play"]>;

export const roomCredentialsPlay: TripJoinGatePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("heading", { name: /Enter trip room/i })).toBeVisible();
  await expect(canvas.getByLabelText(/Trip ID/i)).toHaveValue("HK-SZ-2025");
  await expect(canvas.getByRole("main", { name: /Join trip/i })).toHaveClass("join-page", "bg-(--color-page)");
};

export const tripAccessPlay: TripJoinGatePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("main", { name: /Join trip/i })).toBeVisible();
  await expect(canvas.getByLabelText(/Trip access preview/i)).toHaveClass(
    "trip-access-visual",
    "bg-(--color-surface-subtle)",
  );
  await expect(canvas.getByRole("heading", { name: /Enter trip room/i })).toBeVisible();
};

export const selectIdentityPlay: TripJoinGatePlay = async ({ canvas }) => {
  await expect(await canvas.findByRole("heading", { name: /Choose identity/i })).toBeVisible();
  const memberList = canvas.getByRole("group", { name: /Trip member list/i });
  await expect(memberList).toBeVisible();
  await canvas.getByRole("button", { name: /Travel Mate/i }).click();
  await expect(canvas.getByRole("form", { name: /Travel Mate/i })).toBeVisible();
  await expect(canvas.getByLabelText(/Set password for Travel Mate/i)).toBeVisible();
  await expect(canvas.getByRole("button", { name: /Show participant password/i })).toBeVisible();
};

export const thaiPlay: TripJoinGatePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("heading", { name: /เข้าห้อง trip/i })).toBeVisible();
  await expect(canvas.getByLabelText(/Trip ID/i)).toHaveValue("HK-SZ-2025");
  await expect(canvas.getByRole("button", { name: /เข้าห้อง trip/i })).toBeVisible();
};

export const mobilePlay: TripJoinGatePlay = async ({ canvas, canvasElement }) => {
  await expect(await canvas.findByRole("heading", { name: /Choose identity/i })).toBeVisible();
  await expectJoinResponsiveContract(canvasElement);
  await expect(canvas.getByRole("main", { name: /Join trip/i })).toBeVisible();
};

export const responsiveIdentityPlay: TripJoinGatePlay = async ({ canvas, canvasElement }) => {
  await expect(await canvas.findByRole("heading", { name: /Choose identity/i })).toBeVisible();
  await expectJoinResponsiveContract(canvasElement);
};

export const desktop1440Play: TripJoinGatePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("main", { name: /Join trip/i })).toBeVisible();
  await expect(canvas.getByLabelText(/Trip access preview/i)).toHaveClass("trip-access-visual");
  await expect(canvas.getByRole("heading", { name: /Enter trip room/i })).toBeVisible();
};
