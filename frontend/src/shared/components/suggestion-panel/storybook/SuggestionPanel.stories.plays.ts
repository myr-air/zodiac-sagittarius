import type { StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import type { SuggestionPanel } from "../SuggestionPanel";

type SuggestionPanelPlay = NonNullable<StoryObj<typeof SuggestionPanel>["play"]>;

export const emptyPlay: SuggestionPanelPlay = async ({ canvas }) => {
  await expect(canvas.getByRole("heading", { name: /Suggestions \(0\)|คำแนะนำ \(0\)/ })).toBeVisible();
};
