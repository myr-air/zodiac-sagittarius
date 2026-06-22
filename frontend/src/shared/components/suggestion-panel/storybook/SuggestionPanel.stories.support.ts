import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import type { SuggestionPanelProps } from "../suggestion-panel.types";

type SuggestionPanelStoryArgs = SuggestionPanelProps;

export const suggestionPanelStoryArgs = {
  members: tripFixture.trip.members,
  suggestions: tripFixture.suggestions,
} satisfies SuggestionPanelStoryArgs;

export const emptySuggestionPanelStoryArgs = {
  ...suggestionPanelStoryArgs,
  suggestions: tripFixture.suggestions.map((suggestion) => ({
    ...suggestion,
    status: "approved" as const,
  })),
} satisfies SuggestionPanelStoryArgs;

export const conflictedSuggestionPanelStoryArgs = {
  ...suggestionPanelStoryArgs,
  suggestions: tripFixture.suggestions.map((suggestion, index) => ({
    ...suggestion,
    id: `${suggestion.id}-conflicted-${index}`,
    status: "conflicted" as const,
  })),
} satisfies SuggestionPanelStoryArgs;
