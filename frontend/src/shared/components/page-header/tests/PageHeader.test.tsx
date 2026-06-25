import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  PageHeader,
  PageHeaderMetaItem,
  PageHeaderTripDateMetaItem,
  PageUserCard,
} from "../PageHeader";

describe("PageHeader", () => {
  it("uses a compact command-surface header instead of postcard artwork", () => {
    const { container } = render(
      <PageHeader
        title="Itinerary"
        subtitle="Hong Kong friends trip"
        description="Plan the day without hiding the table."
        meta={<span>6 days</span>}
        aside={<PageUserCard color="#0f766e" label="Can edit" name="Travel Mate" />}
      />,
    );

    const header = screen.getByRole("banner");

    expect(header).toHaveClass("page-header", "rounded-(--radius-md)", "isolate", "bg-(--color-surface)", "shadow-[0_1px_0_rgb(15_23_42_/_0.04)]");
    expect(header).toHaveClass("min-h-[92px]", "max-[1199px]:grid", "max-[1199px]:grid-cols-[minmax(0,1fr)_minmax(180px,260px)]", "max-[1199px]:rounded-none", "max-[767px]:hidden");
    expect(container.querySelector(".page-header-aside")).toHaveClass("max-[1199px]:w-full", "max-[1199px]:justify-self-stretch");
    expect(screen.getByRole("heading", { name: "Hong Kong friends trip", level: 2 })).toHaveClass("max-[767px]:hidden");
    expect(screen.getByText("Plan the day without hiding the table.")).toHaveClass("max-[767px]:hidden");
    expect(header.className).not.toContain("bg-[linear-gradient(135deg");
    expect(header.className).not.toContain("bg-[image:var(--watercolor-surface-wash),var(--paper-grain)]");
    expect(header.className).not.toContain("shadow-[0_12px_30px");
    expect(header.className).not.toContain("shadow-[var(--shadow-panel)]");
    expect(container.querySelector(".page-current-user")?.className).not.toContain("var(--paper-grain)");
    expect(container.querySelector(".page-current-user")).toHaveClass("bg-(--color-surface-subtle)", "rounded-(--radius-sm)");
  });

  it("renders optional regions", () => {
    const { rerender } = render(<PageHeader title="Itinerary" />);

    expect(screen.getByRole("heading", { name: "Itinerary", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("banner")).toHaveClass("overflow-hidden");
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
    expect(screen.getByText("Plan")).toHaveClass("eyebrow", "bg-(--color-primary-soft)", "text-(--color-primary-strong)");
    expect(screen.getByText("Plan").className).not.toContain("uppercase");
    expect(screen.getByRole("heading", { name: "Day one", level: 2 })).toHaveClass("max-[767px]:hidden");
    expect(screen.getByText("A compact overview")).toHaveClass("page-header-description", "max-w-[560px]", "text-(--color-text-muted)");
    expect(screen.getByText("Updated now")).toBeInTheDocument();
    expect(screen.getByText("Motif")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
  });

  it("renders a compact mobile-visible page header variant", () => {
    render(
      <PageHeader
        className="photos-page-header"
        variant="compact"
        title="Photos & Albums"
        subtitle="Hong Kong friends trip"
        meta={<PageHeaderMetaItem icon="cloud">3 album links</PageHeaderMetaItem>}
      />,
    );

    const header = screen.getByRole("banner");

    expect(header).toHaveClass(
      "page-header",
      "page-header--compact",
      "photos-page-header",
      "shadow-none",
      "max-[1199px]:rounded-none",
    );
    expect(header).not.toHaveClass("max-[767px]:hidden");
    expect(screen.getByLabelText("Photos & Albums summary")).toHaveClass("page-header-meta");
    expect(screen.getByText("Hong Kong friends trip")).toHaveClass("truncate");
    expect(screen.queryByRole("heading", { name: "Hong Kong friends trip", level: 2 })).not.toBeInTheDocument();
  });

  it("renders the compact page user card", () => {
    render(<PageUserCard color="#0f766e" label="Current user" name="Aom" />);

    expect(screen.getByText("Aom")).toBeInTheDocument();
    expect(screen.getByText("Current user")).toBeInTheDocument();
    expect(screen.getByText("A")).toHaveStyle({ backgroundColor: "#0f766e" });
    expect(screen.getByText("Aom").closest(".page-current-user")).toHaveClass(
      "grid",
      "min-w-[220px]",
      "bg-(--color-surface-subtle)",
      "rounded-(--radius-sm)",
    );
  });

  it("renders page header meta items with decorative icons", () => {
    render(
      <PageHeader
        title="Itinerary"
        meta={<PageHeaderMetaItem icon="calendar">6 days</PageHeaderMetaItem>}
      />,
    );

    expect(screen.getByText("6 days")).toBeInTheDocument();
    expect(screen.getByText("6 days").closest("span")).toContainHTML("svg");
  });

  it("renders shared trip date range meta", () => {
    render(
      <PageHeader
        title="Trip"
        meta={
          <PageHeaderTripDateMetaItem
            startDate="2026-05-28"
            endDate="2026-06-02"
          />
        }
      />,
    );

    expect(screen.getByText("May 28 – Jun 2, 2026")).toBeInTheDocument();
    expect(screen.getByText("May 28 – Jun 2, 2026").closest("span")).toContainHTML("svg");
  });
});
