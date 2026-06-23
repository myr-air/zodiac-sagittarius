import { expect } from "storybook/test";
import type { OverviewPage } from "@/src/features/itinerary/components";
import type { StoryPlay } from "../support/story-play-types";

type OverviewTemplatePlay = StoryPlay<typeof OverviewPage>;

export const ownerThaiPlay: OverviewTemplatePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /Hong Kong \+ Shenzhen Trip/i })).toBeVisible();
  await expect(canvas.getByRole("region", { name: /travel cockpit/i })).toBeVisible();
  await expect(canvas.getByRole("region", { name: /ไฮไลต์ทริป/i })).toBeVisible();
  await expect(canvas.getByRole("region", { name: /เช็กลิสต์ของทริป/i })).toBeVisible();
  await expect(canvas.getByRole("region", { name: /Trip overview/i })).toHaveClass("grid");
  await expect(canvas.getByRole("region", { name: /Hong Kong \+ Shenzhen Trip/i })).toHaveClass("overview-hero", "grid");
  await expect(canvas.getByRole("region", { name: /travel cockpit/i })).toHaveClass("overview-travel-cockpit", "grid", "grid-cols-3");
};
