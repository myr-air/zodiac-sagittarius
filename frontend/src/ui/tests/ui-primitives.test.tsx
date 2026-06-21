import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  ActionBar,
  Badge,
  Button,
  FieldLabel,
  FloatingActionButton,
  Icon,
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
  workspaceSurfaceElementValues,
  workspacePageClassName,
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
    expect(workspaceSurfaceElementValues).toEqual(["section", "form", "nav", "aside", "div"]);

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
});
