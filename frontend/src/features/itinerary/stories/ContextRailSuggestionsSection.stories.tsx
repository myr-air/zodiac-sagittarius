import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, expect, userEvent } from "storybook/test";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { ContextRailSuggestionsSection } from "@/src/features/itinerary/components/context-rail/ContextRailSuggestionsSection";

const baseArgs = {
  suggestions: tripFixture.suggestions,
  tripMembers: tripFixture.trip.members,
  canReviewSuggestions: true,
  onReviewSuggestion: fn(),
};

const meta = {
  title: "Design System/Context Rail/Suggestions Section",
  component: ContextRailSuggestionsSection,
} satisfies Meta<typeof ContextRailSuggestionsSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Editable: Story = {
  args: baseArgs,
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("region", { name: /Suggestion review/i }),
    ).toBeInTheDocument();
    const approveButtons = canvas.getAllByRole("button", { name: /Approve/ });
    await expect(approveButtons[0]).toBeInTheDocument();
    await userEvent.click(approveButtons[0]);
  },
};

export const ReadOnly: Story = {
  args: {
    ...baseArgs,
    canReviewSuggestions: false,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Read only")).toBeInTheDocument();
    await expect(
      canvas.queryByRole("button", { name: /Approve/ }),
    ).not.toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: {
    ...baseArgs,
    suggestions: [],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("No suggestions waiting for this stop."),).toBeInTheDocument();
  },
};
