import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { formatTripRange, PageHeader, PageUserCard } from "@/src/shared/components/page-header";
import {
  ActionBar,
  Badge,
  Button,
  FieldLabel,
  FloatingActionButton,
  IconButton,
  Panel,
  SegmentedControl,
  Select,
  SwapButton,
  TextArea,
  TextInput,
  WorkspacePage,
  WorkspaceSurface,
  fieldControlClassName,
  workspacePageClassName,
  Icon,
} from "@/src/ui";

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

  it("renders reusable workspace layout, surface, and field primitives", () => {
    render(
      <WorkspacePage className="photos-page" kind="workspace" aria-label="Workspace">
        <WorkspaceSurface as="form" aria-label="Trip details" className="settings-form">
          <FieldLabel>
            <span>Trip name</span>
            <input className={fieldControlClassName.join(" ")} />
          </FieldLabel>
        </WorkspaceSurface>
        <WorkspaceSurface as="nav" aria-label="Folders" density="compact" className="folder-rail">
          <button type="button">All</button>
        </WorkspaceSurface>
      </WorkspacePage>,
    );

    expect(screen.getByRole("region", { name: "Workspace" })).toHaveClass(
      "min-h-full",
      "grid",
      "grid-rows-[auto_minmax(0,1fr)]",
      "photos-page",
    );
    expect(workspacePageClassName("standard", "trip-settings-page")).toContain("max-[1199px]:min-h-[calc(100dvh-48px)]");
    expect(screen.getByRole("form", { name: "Trip details" })).toHaveClass(
      "rounded-(--radius-lg)",
      "bg-(--color-surface)",
      "shadow-[0_1px_0_rgb(15_23_42_/_0.04)]",
      "settings-form",
    );
    expect(screen.getByRole("navigation", { name: "Folders" })).toHaveClass("p-3.5", "folder-rail");
    expect(screen.getByText("Trip name").closest("label")).toHaveClass("grid", "gap-1.5", "text-(--color-text)");
    expect(screen.getByRole("textbox")).toHaveClass("focus:border-(--color-route-border)", "disabled:bg-(--color-surface-muted)");
  });

  it("renders shared form controls and action controllers", async () => {
    const user = userEvent.setup();
    let selected = "all";
    const { rerender } = render(
      <>
        <FieldLabel>
          <span>Search</span>
          <TextInput placeholder="Find stops" />
        </FieldLabel>
        <FieldLabel>
          <span>Status</span>
          <Select defaultValue="open">
            <option value="open">Open</option>
            <option value="done">Done</option>
          </Select>
        </FieldLabel>
        <FieldLabel>
          <span>Notes</span>
          <TextArea />
        </FieldLabel>
        <ActionBar aria-label="Actions">
          <Button variant="ghost">Cancel</Button>
          <Button>Save</Button>
        </ActionBar>
        <SegmentedControl
          aria-label="Filter"
          value={selected}
          options={[
            { value: "all", label: "All" },
            { value: "mine", label: "Mine" },
          ]}
          onChange={(value) => {
            selected = value;
          }}
        />
        <FloatingActionButton type="button">Add</FloatingActionButton>
        <SwapButton aria-label="Swap dates">
          <Icon name="redo" />
        </SwapButton>
      </>,
    );

    expect(screen.getByPlaceholderText("Find stops")).toHaveClass("min-h-10", "w-full", "focus:border-(--color-route-border)");
    expect(screen.getByRole("combobox", { name: "Status" })).toHaveClass("min-h-10", "w-full", "border-(--color-border)");
    expect(screen.getByRole("textbox", { name: "Notes" })).toHaveClass("min-h-[88px]", "resize-y");
    expect(screen.getByLabelText("Actions")).toHaveClass("action-bar", "justify-end");
    expect(screen.getByRole("button", { name: "Add" })).toHaveClass("floating-action-button", "fixed", "rounded-full");
    expect(screen.getByRole("button", { name: "Swap dates" })).toHaveClass("swap-button", "icon-button");
    await user.click(screen.getByRole("button", { name: "Mine" }));
    expect(selected).toBe("mine");

    rerender(
      <SegmentedControl
        aria-label="Filter"
        value="mine"
        options={[
          { value: "all", label: "All" },
          { value: "mine", label: "Mine" },
        ]}
        onChange={() => undefined}
      />,
    );
    expect(screen.getByRole("button", { name: "Mine" })).toHaveAttribute("data-selected", "true");
  });

  it("renders page headers with and without optional regions", () => {
    const { rerender } = render(<PageHeader title="Itinerary" />);

    expect(screen.getByRole("heading", { name: "Itinerary", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("banner")).toHaveClass(
      "page-header",
      "min-h-[92px]",
      "max-[767px]:hidden",
      "overflow-hidden",
      "bg-(--color-surface)",
      "shadow-[0_1px_0_rgb(15_23_42_/_0.04)]",
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
    expect(screen.getByRole("heading", { name: "Day one", level: 2 })).toHaveClass("max-[767px]:hidden");
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
    expect(screen.getByText("Aom").closest(".page-current-user")).toHaveClass("grid", "min-w-[220px]", "bg-(--color-surface-subtle)");
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
      "sunrise",
      "sunset",
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
