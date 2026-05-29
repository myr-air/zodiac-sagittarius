import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { tripFixture } from "@/src/demo/trip-fixtures";
import { SuggestionPanel } from "./SuggestionPanel";

describe("SuggestionPanel", () => {
  it("shows pending and conflicted suggestions with proposer fallbacks", () => {
    render(
      <SuggestionPanel
        members={tripFixture.trip.members}
        suggestions={[
          ...tripFixture.suggestions,
          {
            ...tripFixture.suggestions[0],
            id: "suggestion-approved",
            status: "approved",
            proposedPatch: { activity: "Hidden approved item" },
          },
          {
            ...tripFixture.suggestions[0],
            id: "suggestion-unknown",
            proposerId: "missing-member",
            proposedPatch: {},
          },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "คำแนะนำ (3)" })).toBeInTheDocument();
    expect(screen.getAllByText("แนะนำให้จองคิวล่วงหน้า")).toHaveLength(3);
    expect(screen.getByText("Traveler suggested an update")).toBeInTheDocument();
    expect(screen.queryByText("Hidden approved item")).not.toBeInTheDocument();
  });
});
