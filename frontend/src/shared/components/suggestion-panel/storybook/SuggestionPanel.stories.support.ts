import {
  storySuggestions,
  storyTrip,
} from "@/src/trip/testing/fixtures/trip-story-fixtures";
import type { SuggestionPanelProps } from "../suggestion-panel.types";

type SuggestionPanelStoryArgs = SuggestionPanelProps;

export const suggestionPanelStoryArgs = {
  members: storyTrip.members,
  suggestions: storySuggestions,
} satisfies SuggestionPanelStoryArgs;

export const emptySuggestionPanelStoryArgs = {
  ...suggestionPanelStoryArgs,
  suggestions: storySuggestions.map((suggestion) => ({
    ...suggestion,
    status: "approved" as const,
  })),
} satisfies SuggestionPanelStoryArgs;

export const conflictedSuggestionPanelStoryArgs = {
  ...suggestionPanelStoryArgs,
  suggestions: storySuggestions.map((suggestion, index) => ({
    ...suggestion,
    id: `${suggestion.id}-conflicted-${index}`,
    status: "conflicted" as const,
  })),
} satisfies SuggestionPanelStoryArgs;
