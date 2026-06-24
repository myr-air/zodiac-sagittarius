import type { StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import type { PageHeader } from "../PageHeader";

type PageHeaderPlay = NonNullable<StoryObj<typeof PageHeader>["play"]>;

export const friendlyPlay: PageHeaderPlay = async ({ canvas }) => {
  await expect(canvas.getByRole("heading", { name: tripFixture.trip.name })).toBeVisible();
};
