import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { formatTripRange, PageHeader, PageUserCard } from "../PageHeader";

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

  it("renders optional regions and trip ranges", () => {
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
    expect(screen.getByText("Aom").closest(".page-current-user")).toHaveClass(
      "grid",
      "min-w-[220px]",
      "bg-(--color-surface-subtle)",
      "rounded-(--radius-sm)",
    );
  });
});
