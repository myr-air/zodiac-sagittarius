import type { StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";
import type { ContextRailSuggestionsSection } from "@/src/features/itinerary/components/context-rail/ContextRailSuggestionsSection";

type ContextRailSuggestionsSectionPlay = NonNullable<StoryObj<typeof ContextRailSuggestionsSection>["play"]>;

export const editablePlay: ContextRailSuggestionsSectionPlay = async ({ canvas }) => {
  await expect(
    canvas.getByRole("region", { name: /Suggestion review/i }),
  ).toBeInTheDocument();
  const approveButtons = canvas.getAllByRole("button", { name: /Approve/ });
  await expect(approveButtons[0]).toBeInTheDocument();
  await userEvent.click(approveButtons[0]);
};

export const readOnlyPlay: ContextRailSuggestionsSectionPlay = async ({ canvas }) => {
  await expect(canvas.getByText("Read only")).toBeInTheDocument();
  await expect(
    canvas.queryByRole("button", { name: /Approve/ }),
  ).not.toBeInTheDocument();
};

export const emptyPlay: ContextRailSuggestionsSectionPlay = async ({ canvas }) => {
  await expect(canvas.getByText("No suggestions waiting for this stop.")).toBeInTheDocument();
};
