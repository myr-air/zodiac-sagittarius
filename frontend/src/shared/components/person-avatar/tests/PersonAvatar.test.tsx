import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PersonAvatar } from "../PersonAvatar";

describe("PersonAvatar", () => {
  it("renders a centralized member initial with caller layout classes", () => {
    render(
      <PersonAvatar
        className="grid size-8 rounded-full"
        color="#2563eb"
        name="  aom"
        title="Aom"
      />,
    );

    const avatar = screen.getByText("A");
    expect(avatar).toHaveClass("person-avatar", "grid", "size-8");
    expect(avatar).toHaveStyle({ backgroundColor: "#2563eb" });
    expect(avatar).toHaveAttribute("aria-hidden", "true");
    expect(avatar).toHaveAttribute("title", "Aom");
  });

  it("uses the member initial fallback for empty names", () => {
    render(<PersonAvatar color="#0f766e" name="" />);

    expect(screen.getByText("?")).toBeInTheDocument();
  });
});
