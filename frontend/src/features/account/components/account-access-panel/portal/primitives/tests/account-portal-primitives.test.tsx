import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  PortalEmptyState,
  PortalListSkeleton,
  PortalStatSkeleton,
  SettingLine,
  Stat,
} from "../account-portal-primitives";

describe("account portal primitives", () => {
  it("renders stat and setting rows with the shared account metric shell", () => {
    render(
      <>
        <Stat label="Trips" value={8} />
        <SettingLine label="Trusted devices" value="2" />
      </>,
    );

    const stat = screen.getByText("Trips").closest(".account-stat");
    const setting = screen.getByText("Trusted devices").closest(".account-setting-line");

    expect(stat).toHaveClass("grid");
    expect(stat).toHaveClass("rounded-(--radius-md)");
    expect(setting).toHaveClass("grid");
    expect(setting).toHaveClass("rounded-(--radius-md)");
  });

  it("renders skeleton rows from the shared portal skeleton variants", () => {
    const { container } = render(
      <>
        <PortalStatSkeleton />
        <PortalListSkeleton rows={2} />
      </>,
    );

    expect(container.querySelectorAll(".portal-skeleton-card")).toHaveLength(4);
    expect(container.querySelectorAll(".portal-skeleton-row")).toHaveLength(2);
    expect(container.querySelector(".portal-skeleton--number")).not.toBeNull();
    expect(container.querySelector(".portal-skeleton--icon")).not.toBeNull();
  });

  it("renders portal empty states through the shared workspace empty-state shell", () => {
    render(
      <PortalEmptyState
        actionHref="/portal/new-trip"
        actionLabel="Create trip"
        detail="Start a workspace before inviting travelers."
        icon="plus"
        title="No trips yet"
      />,
    );

    expect(screen.getByText("No trips yet")).toHaveClass("text-(--color-text)");
    expect(screen.getByRole("link", { name: /Create trip/i })).toHaveAttribute(
      "href",
      "/portal/new-trip",
    );
    expect(screen.getByText("No trips yet").closest(".portal-empty-state")).toHaveClass(
      "grid",
    );
  });
});
