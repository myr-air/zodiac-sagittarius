import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WorkspaceSummaryStat } from "./WorkspaceSummaryStat";

describe("WorkspaceSummaryStat", () => {
  it("renders a labelled workspace metric with an icon", () => {
    render(
      <WorkspaceSummaryStat
        className="metric-card"
        icon="wallet"
        label="Trip spend"
        value="$420"
      />,
    );

    expect(screen.getByText("Trip spend")).toBeInTheDocument();
    expect(screen.getByText("$420")).toBeInTheDocument();
  });

  it("applies the configured value tone class", () => {
    render(
      <WorkspaceSummaryStat
        className="metric-card"
        icon="check"
        label="Balance"
        tone="positive"
        value="+$24"
        valueToneClassNames={{ positive: "text-positive" }}
      />,
    );

    expect(screen.getByText("+$24")).toHaveClass("text-positive");
  });
});
