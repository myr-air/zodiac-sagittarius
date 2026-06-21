import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader, PageUserCard } from "../PageHeader";

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
});
