import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { tripFixture } from "@/src/demo/trip-fixtures";
import { SuggestionPanel } from "./SuggestionPanel";

const meta = {
  title: "Design System/Suggestion Panel",
  component: SuggestionPanel,
  parameters: { layout: "padded" },
  tags: ["ai-generated"],
} satisfies Meta<typeof SuggestionPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    members: tripFixture.trip.members,
    suggestions: tripFixture.suggestions,
  },
};

export const Thai: Story = {
  args: {
    members: tripFixture.trip.members,
    suggestions: tripFixture.suggestions,
  },
  parameters: { locale: "th" },
};

export const Empty: Story = {
  args: {
    members: tripFixture.trip.members,
    suggestions: tripFixture.suggestions.map((suggestion) => ({ ...suggestion, status: "approved" })),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: /Suggestions \(0\)|คำแนะนำ \(0\)/ })).toBeVisible();
  },
};

export const ConflictedHeavy: Story = {
  args: {
    members: tripFixture.trip.members,
    suggestions: tripFixture.suggestions.map((suggestion, index) => ({
      ...suggestion,
      id: `${suggestion.id}-conflicted-${index}`,
      status: "conflicted",
    })),
  },
};
