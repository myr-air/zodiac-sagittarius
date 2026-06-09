import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader, PageUserCard } from "./PageHeader";

describe("PageHeader", () => {
  it("uses a compact flat cockpit header instead of postcard artwork", () => {
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

    expect(header).toHaveClass("page-header", "bg-(--color-surface)", "max-[767px]:min-h-[132px]");
    expect(header.className).not.toContain("bg-[image:var(--watercolor-surface-wash),var(--paper-grain)]");
    expect(header.className).not.toContain("shadow-[0_12px_30px");
    expect(container.querySelector(".page-current-user")?.className).not.toContain("var(--paper-grain)");
  });
});
