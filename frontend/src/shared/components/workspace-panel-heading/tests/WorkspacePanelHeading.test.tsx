import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  WorkspacePanelHeading,
  workspacePanelHeadingVariantValues,
} from "../WorkspacePanelHeading";

describe("WorkspacePanelHeading", () => {
  it("renders a level two heading with an icon and stable id", () => {
    const { container } = render(
      <WorkspacePanelHeading icon="wallet" id="settlement-panel" title="Settle up" />,
    );

    expect(screen.getByRole("heading", { name: "Settle up", level: 2 })).toHaveAttribute(
      "id",
      "settlement-panel",
    );
    expect(container.querySelector("h2 svg")).not.toBeNull();
  });

  it("supports the compact and overview variants", () => {
    expect(workspacePanelHeadingVariantValues).toEqual(["compact", "overview"]);

    render(<WorkspacePanelHeading icon="route" title="Today focus" variant="overview" />);

    expect(screen.getByRole("heading", { name: "Today focus" })).toHaveClass("overview-panel-title");
  });
});
