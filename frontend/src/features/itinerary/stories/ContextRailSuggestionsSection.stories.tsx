import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { ContextRailSuggestionsSection } from "@/src/features/itinerary/components/context-rail/ContextRailSuggestionsSection";
import { editablePlay, emptyPlay, readOnlyPlay } from "./ContextRailSuggestionsSection.stories.plays";

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
  play: editablePlay,
};

export const ReadOnly: Story = {
  args: {
    ...baseArgs,
    canReviewSuggestions: false,
  },
  play: readOnlyPlay,
};

export const Empty: Story = {
  args: {
    ...baseArgs,
    suggestions: [],
  },
  play: emptyPlay,
};
