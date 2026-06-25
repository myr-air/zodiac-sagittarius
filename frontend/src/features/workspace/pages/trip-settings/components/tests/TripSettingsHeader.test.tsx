import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TripSettingsHeader } from "../TripSettingsHeader";

describe("TripSettingsHeader", () => {
  it("renders settings copy and current role metadata", () => {
    render(
      <TripSettingsHeader
        title="Trip settings"
        subtitle="Hong Kong food crawl"
        description="Keep the source of truth for this trip."
        locale="en"
        memberCountLabel="4 members"
        roleLabel="Current role: owner"
        tripEndDate="2025-03-15"
        tripStartDate="2025-03-10"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Trip settings", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Hong Kong food crawl")).toBeInTheDocument();
    expect(
      screen.getByText("Keep the source of truth for this trip."),
    ).toBeInTheDocument();
    expect(screen.getByText("Mar 10–15, 2025")).toBeInTheDocument();
    expect(screen.getByText("4 members")).toBeInTheDocument();
    expect(screen.getByText("Current role: owner")).toBeInTheDocument();
  });
});
