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
        roleLabel="Current role: owner"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Trip settings", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Hong Kong food crawl")).toBeInTheDocument();
    expect(
      screen.getByText("Keep the source of truth for this trip."),
    ).toBeInTheDocument();
    expect(screen.getByText("Current role: owner")).toBeInTheDocument();
  });
});
