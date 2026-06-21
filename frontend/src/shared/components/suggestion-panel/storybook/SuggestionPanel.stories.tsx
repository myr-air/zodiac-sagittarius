import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SuggestionPanel } from "../SuggestionPanel";
import { emptyPlay } from "./SuggestionPanel.stories.plays";
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
  play: emptyPlay,
};

export const ConflictedHeavy: Story = {
  args: conflictedSuggestionPanelStoryArgs,
};
