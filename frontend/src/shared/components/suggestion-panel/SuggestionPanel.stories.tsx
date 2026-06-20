import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { SuggestionPanel } from "./SuggestionPanel";
import {
  conflictedSuggestionPanelStoryArgs,
  emptySuggestionPanelStoryArgs,
  suggestionPanelStoryArgs,
} from "./SuggestionPanel.stories.support";

const meta = {
  title: "Design System/Suggestion Panel",
  component: SuggestionPanel,
  parameters: { layout: "padded" },
  tags: ["ai-generated"],
} satisfies Meta<typeof SuggestionPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: suggestionPanelStoryArgs,
};

export const Thai: Story = {
  args: suggestionPanelStoryArgs,
  parameters: { locale: "th" },
};

export const Empty: Story = {
  args: emptySuggestionPanelStoryArgs,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: /Suggestions \(0\)|คำแนะนำ \(0\)/ })).toBeVisible();
  },
};

export const ConflictedHeavy: Story = {
  args: conflictedSuggestionPanelStoryArgs,
};
