import { expect } from "storybook/test";
import type { TimelineView } from "@/src/features/itinerary/components";
import type { StoryPlay } from "./support/story-play-types";

type TimelineTemplatePlay = StoryPlay<typeof TimelineView>;

export const ownerPlay: TimelineTemplatePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("button", { name: /Dim Dim Sum/i })).toHaveAttribute("aria-pressed", "true");
};

export const ownerThaiPlay: TimelineTemplatePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /ไทม์ไลน์ทริป/i })).toBeVisible();
  await expect(canvas.getByRole("button", { name: /เลือกจุดในไทม์ไลน์ Dim Dim Sum/i })).toHaveAttribute("aria-pressed", "true");
  await expect(canvas.getByRole("region", { name: /ไทม์ไลน์ทริป/i })).toHaveClass("timeline-panel", "grid");
  await expect(canvas.getByRole("button", { name: /เลือกจุดในไทม์ไลน์ Dim Dim Sum/i })).toHaveClass("timeline-stop-button", "grid");
};
