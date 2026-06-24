import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OverviewPanelTitle } from "../OverviewPanelTitle";

describe("OverviewPanelTitle", () => {
  it("renders the shared overview panel heading with an optional title id", () => {
    render(<OverviewPanelTitle icon="route" title="Today focus" titleId="overview-title" />);

    expect(screen.getByRole("heading", { name: "Today focus", level: 2 })).toHaveAttribute(
      "id",
      "overview-title",
    );
  });
});
