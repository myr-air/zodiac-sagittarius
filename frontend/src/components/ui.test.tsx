import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Icon } from "./icons";
import { formatTripRange, PageHeader, PageUserCard } from "./PageHeader";
import { Badge, Button, Panel } from "./ui";

describe("shared UI primitives", () => {
  it("composes default and custom classes for buttons, panels, and badges", () => {
    render(
      <Panel className="trip-panel" aria-label="Panel">
        <Button className="trip-action">Save</Button>
        <Badge className="trip-badge">Ready</Badge>
      </Panel>,
    );

    expect(screen.getByRole("button", { name: "Save" })).toHaveClass("button", "button--primary", "trip-action");
    expect(screen.getByLabelText("Panel")).toHaveClass("panel", "trip-panel");
    expect(screen.getByText("Ready")).toHaveClass("badge", "badge--neutral", "trip-badge");
  });

  it("renders page headers with and without optional regions", () => {
    const { rerender } = render(<PageHeader title="Itinerary" />);

    expect(screen.getByRole("heading", { name: "Itinerary", level: 1 })).toBeInTheDocument();
    expect(screen.queryByText("Plan")).not.toBeInTheDocument();

    rerender(
      <PageHeader
        eyebrow="Plan"
        title="Itinerary"
        subtitle="Day one"
        description="A compact overview"
        meta={<span>Updated now</span>}
        motif={<span>Motif</span>}
        aside={<button type="button">Share</button>}
      />,
    );

    expect(screen.getByText("Plan")).toHaveClass("eyebrow");
    expect(screen.getByRole("heading", { name: "Day one", level: 2 })).toBeInTheDocument();
    expect(screen.getByText("A compact overview")).toHaveClass("page-header-description");
    expect(screen.getByText("Updated now")).toBeInTheDocument();
    expect(screen.getByText("Motif")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
    expect(formatTripRange("bad-date", "bad-date")).toContain("NaN  NaN");
    expect(formatTripRange("2026-05-28", "2026-06-02")).toBe("May 28 – Jun 2, 2026");
    expect(formatTripRange("2026-12-30", "2027-01-02")).toBe("Dec 30, 2026 – Jan 2, 2027");
    expect(formatTripRange("2026-05-28", "2026-06-02", "th")).toBe("28 พ.ค. – 2 มิ.ย. 2026");
  });

  it("renders the compact page user card", () => {
    render(<PageUserCard color="#0f766e" label="Current user" name="Aom" />);

    expect(screen.getByText("Aom")).toBeInTheDocument();
    expect(screen.getByText("Current user")).toBeInTheDocument();
    expect(screen.getByText("A")).toHaveStyle({ backgroundColor: "#0f766e" });
  });

  it("renders every supported icon branch", () => {
    const iconNames = [
      "alertCircle",
      "calendar",
      "check",
      "chevronLeft",
      "chevronRight",
      "clock",
      "cloud",
      "copy",
      "document",
      "dots",
      "drag",
      "edit",
      "eye",
      "eyeOff",
      "external",
      "home",
      "layout",
      "lightbulb",
      "list",
      "location",
      "map",
      "menu",
      "note",
      "panel",
      "plus",
      "redo",
      "route",
      "settings",
      "table",
      "trash",
      "undo",
      "utensils",
      "users",
      "wallet",
      "x",
      "warning",
    ] as const;

    const { container } = render(
      <>
        {iconNames.map((name) => (
          <Icon key={name} name={name} data-testid={`icon-${name}`} />
        ))}
      </>,
    );

    expect(container.querySelectorAll("svg")).toHaveLength(iconNames.length);
  });
});
