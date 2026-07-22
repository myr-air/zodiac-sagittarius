/**
 * DestinationCards — SSR-safe popular destination grid (hydrate-stable markup).
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { POPULAR_DESTINATIONS } from "@/src/landing/destinations";
import { DestinationCards } from "./DestinationCards";

describe("DestinationCards", () => {
  it("renders the same popular destination names for SSR-safe hydrate", () => {
    const onSeed = vi.fn();
    const { container } = render(<DestinationCards onSeed={onSeed} />);

    expect(
      screen.getByRole("heading", { name: "Popular destinations" }),
    ).toBeInTheDocument();

    for (const dest of POPULAR_DESTINATIONS) {
      expect(
        screen.getByRole("button", { name: dest.name }),
      ).toBeInTheDocument();
    }

    // Stable section id + reveal class (animation gated by html attr after mount).
    const section = container.querySelector("#destinations");
    expect(section).toHaveClass("landing-reveal");
    expect(section?.className).not.toMatch(/\bis-in\b/);
  });
});
