import type { StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

type OverviewRolePanelsPlay = NonNullable<StoryObj["play"]>;

export const travelerPlay: OverviewRolePanelsPlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /traveler highlights/i })).toBeInTheDocument();
  await expect(canvas.getByRole("region", { name: /my travel checklist/i })).toBeInTheDocument();
  await expect(canvas.getByRole("button", { name: /^add$/i })).toBeInTheDocument();
};

export const viewerPlay: OverviewRolePanelsPlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /read-only trip snapshot/i })).toBeInTheDocument();
  await expect(canvas.getByRole("region", { name: /next important stop/i })).toBeInTheDocument();
  await expect(canvas.queryByRole("button", { name: /add checklist item/i })).toBeNull();
};

export const managerPlay: OverviewRolePanelsPlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /trip readiness/i })).toBeInTheDocument();
  await expect(canvas.getByRole("region", { name: /trip checklist/i })).toBeInTheDocument();
  await expect(canvas.getByRole("group", { name: /checklist scope/i })).toBeInTheDocument();
  await expect(canvas.getByRole("button", { name: /add checklist item/i })).toBeInTheDocument();
};
