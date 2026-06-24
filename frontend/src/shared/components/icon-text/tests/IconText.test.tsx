import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IconText } from "../IconText";

describe("IconText", () => {
  it("renders an icon with inline text content", () => {
    const { container } = render(<IconText icon="calendar">May 28</IconText>);

    expect(screen.getByText("May 28")).toBeInTheDocument();
    expect(container.querySelector("span svg")).not.toBeNull();
  });

  it("keeps caller layout classes on the root span", () => {
    const { container } = render(
      <IconText icon="users" className="flex min-w-0 items-center gap-1.5">
        Aom
      </IconText>,
    );

    expect(container.querySelector("span")).toHaveClass("flex", "min-w-0", "items-center", "gap-1.5");
  });
});
