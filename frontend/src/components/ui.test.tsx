import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Icon } from "./icons";
import { formatTripRange, PageHeader, PageUserCard } from "./PageHeader";
import { Badge, Button, IconButton, Panel } from "./ui";

describe("shared UI primitives", () => {
  it("composes Tailwind defaults, legacy bridge classes, and custom classes", () => {
    render(
      <Panel className="trip-panel" aria-label="Panel">
        <Button className="trip-action">Save</Button>
        <Button variant="danger" disabled>
          Delete
        </Button>
        <Badge className="trip-badge">Ready</Badge>
        <Badge tone="danger">Blocked</Badge>
        <IconButton aria-label="Open details" className="details-toggle-button">
          <Icon name="panel" />
        </IconButton>
      </Panel>,
    );

    expect(screen.getByRole("button", { name: "Save" })).toHaveClass(
      "button",
      "button--primary",
      "inline-flex",
      "bg-(--color-primary)",
      "trip-action",
    );
    expect(screen.getByRole("button", { name: "Delete" })).toHaveClass(
      "button",
      "button--danger",
      "disabled:bg-(--color-surface-muted)",
    );
    expect(screen.getByLabelText("Panel")).toHaveClass(
      "panel",
      "grid",
      "gap-3",
      "rounded-(--radius-lg)",
      "trip-panel",
    );
    expect(screen.getByText("Ready")).toHaveClass("badge", "badge--neutral", "inline-flex", "rounded-full", "trip-badge");
    expect(screen.getByText("Blocked")).toHaveClass("badge--danger", "text-[#b91c1c]", "bg-(--color-danger-soft)");
    expect(screen.getByRole("button", { name: "Open details" })).toHaveClass("icon-button", "inline-flex", "w-9", "details-toggle-button");
  });

  it("renders page headers with and without optional regions", () => {
    const { rerender } = render(<PageHeader title="Itinerary" />);

    expect(screen.getByRole("heading", { name: "Itinerary", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("banner")).toHaveClass(
      "page-header",
      "min-h-[108px]",
      "overflow-hidden",
      "bg-[color-mix(in_srgb,var(--color-surface)_88%,var(--color-postcard))]",
      "shadow-[0_6px_8px_rgb(55_47_38_/_0.045)]",
    );
    expect(screen.queryByText("Plan")).not.toBeInTheDocument();

    rerender(
      <PageHeader
        allowOverflow
        eyebrow="Plan"
        title="Itinerary"
        subtitle="Day one"
        description="A compact overview"
        meta={<span>Updated now</span>}
        motif={<span>Motif</span>}
        aside={<button type="button">Share</button>}
      />,
    );

    expect(screen.getByRole("banner")).toHaveClass("z-[40]", "overflow-visible");
    expect(screen.getByText("Plan")).toHaveClass("eyebrow");
    expect(screen.getByText("Plan")).toHaveClass("bg-(--color-primary-soft)", "text-(--color-primary-strong)");
    expect(screen.getByText("Plan").className).not.toContain("uppercase");
    expect(screen.getByRole("heading", { name: "Day one", level: 2 })).toBeInTheDocument();
    expect(screen.getByText("A compact overview")).toHaveClass("page-header-description");
    expect(screen.getByText("A compact overview")).toHaveClass("max-w-[560px]", "text-(--color-text-muted)");
    expect(screen.getByText("Updated now")).toBeInTheDocument();
    expect(screen.getByText("Motif")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
    expect(formatTripRange("bad-date", "bad-date")).toBe("bad-date – bad-date");
    expect(formatTripRange("2026-05-28", "2026-06-02")).toBe("May 28 – Jun 2, 2026");
    expect(formatTripRange("2026-12-30", "2027-01-02")).toBe("Dec 30, 2026 – Jan 2, 2027");
    expect(formatTripRange("2026-05-28", "2026-06-02", "th")).toBe("28 พ.ค. – 2 มิ.ย. 2026");
  });

  it("renders the compact page user card", () => {
    render(<PageUserCard color="#0f766e" label="Current user" name="Aom" />);

    expect(screen.getByText("Aom")).toBeInTheDocument();
    expect(screen.getByText("Current user")).toBeInTheDocument();
    expect(screen.getByText("A")).toHaveStyle({ backgroundColor: "#0f766e" });
    expect(screen.getByText("Aom").closest(".page-current-user")).toHaveClass("grid", "min-w-[236px]", "bg-[rgb(255_255_255_/_0.72)]");
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
