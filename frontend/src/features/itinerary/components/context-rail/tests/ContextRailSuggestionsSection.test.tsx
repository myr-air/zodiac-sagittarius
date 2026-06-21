import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Suggestion, Trip } from "@/src/trip/types";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { ContextRailSuggestionsSection } from "../ContextRailSuggestionsSection";

function renderSection(
  props: Partial<{
    suggestions: Suggestion[];
    tripMembers: Trip["members"];
    canReviewSuggestions: boolean;
  }> = {},
) {
  const onReviewSuggestion = vi.fn();

  renderWithI18n(
    <ContextRailSuggestionsSection
      suggestions={tripFixture.suggestions}
      tripMembers={tripFixture.trip.members}
      canReviewSuggestions={false}
      onReviewSuggestion={onReviewSuggestion}
      {...props}
    />,
    { locale: "en" },
  );

  return { onReviewSuggestion };
}

describe("ContextRailSuggestionsSection", () => {
  it("renders suggestion items and review actions", () => {
    const { onReviewSuggestion } = renderSection({ canReviewSuggestions: true });

    expect(screen.getByRole("region", { name: /Suggestion review/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Suggestions (2)" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Needs decision")).toBeInTheDocument();

    const approveButtons = screen.getAllByRole("button", {
      name: /^Approve /,
    });
    expect(approveButtons).toHaveLength(2);
    fireEvent.click(approveButtons[0]);

    const rejectButtons = screen.getAllByRole("button", {
      name: /^Reject /,
    });
    expect(rejectButtons).toHaveLength(2);
    fireEvent.click(rejectButtons[0]);

    expect(onReviewSuggestion).toHaveBeenCalledWith(
      tripFixture.suggestions[0].id,
      "approved",
    );
    expect(onReviewSuggestion).toHaveBeenCalledWith(
      tripFixture.suggestions[0].id,
      "rejected",
    );
  });

  it("hides review actions in read-only mode", () => {
    renderSection({ canReviewSuggestions: false });

    expect(screen.getByText("Read only")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Approve / }),
    ).not.toBeInTheDocument();
  });

  it("shows an empty state when no suggestions exist", () => {
    renderSection({ suggestions: [] });

    expect(
      screen.getByText("No suggestions waiting for this stop."),
    ).toBeInTheDocument();
  });
});
