import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader, PageUserCard } from "./PageHeader";

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

    expect(header).toHaveClass("page-header", "rounded-(--radius-lg)", "isolate", "bg-[color-mix(in_srgb,var(--color-surface)_88%,var(--color-postcard))]", "shadow-[0_6px_8px_rgb(55_47_38_/_0.045)]");
    expect(header).toHaveClass("min-h-[108px]", "max-[767px]:min-h-0");
    expect(header.className).not.toContain("bg-[linear-gradient(135deg");
    expect(header.className).not.toContain("bg-[image:var(--watercolor-surface-wash),var(--paper-grain)]");
    expect(header.className).not.toContain("shadow-[0_12px_30px");
    expect(header.className).not.toContain("shadow-[var(--shadow-panel)]");
    expect(container.querySelector(".page-current-user")?.className).not.toContain("var(--paper-grain)");
    expect(container.querySelector(".page-current-user")).toHaveClass("bg-[rgb(255_255_255_/_0.72)]", "rounded-(--radius-md)");
  });
});
