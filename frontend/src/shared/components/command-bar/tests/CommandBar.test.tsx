import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CommandBar } from "../CommandBar";

describe("CommandBar", () => {
  it("renders trip name truncated to 40 characters", () => {
    render(
      <CommandBar
        tripName="A very long trip name that exceeds forty characters by quite a bit"
        dateWindowLabel="March–April 2027"
      />,
    );
    const name = screen.getByText(/A very long trip name/);
    expect(name).toBeInTheDocument();
    expect(name.textContent!.length).toBeLessThanOrEqual(40);
  });

  it("renders date window label", () => {
    render(
      <CommandBar
        tripName="Bangkok 2027"
        dateWindowLabel="March–April 2027"
      />,
    );
    expect(screen.getByText("March–April 2027")).toBeInTheDocument();
  });

  it("shows saved badge when not dirty", () => {
    render(
      <CommandBar
        tripName="Bangkok 2027"
        dateWindowLabel="March–April 2027"
      />,
    );
    expect(screen.getByText("บันทึกแล้ว")).toBeInTheDocument();
  });

  it("shows draft badge when dirty", () => {
    render(
      <CommandBar
        tripName="Bangkok 2027"
        dateWindowLabel="March–April 2027"
        isDirty
      />,
    );
    expect(screen.getByText("ร่าง")).toBeInTheDocument();
    expect(screen.queryByText("บันทึกแล้ว")).not.toBeInTheDocument();
  });

  it("renders nothing when hidden", () => {
    const { container } = render(
      <CommandBar
        tripName="Bangkok 2027"
        dateWindowLabel="March–April 2027"
        hidden
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders children when provided", () => {
    render(
      <CommandBar
        tripName="Bangkok 2027"
        dateWindowLabel="March–April 2027"
      >
        <button type="button">Action</button>
      </CommandBar>,
    );
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
  });

  it("has full trip name as title attribute for accessibility", () => {
    render(
      <CommandBar
        tripName="Bangkok 2027"
        dateWindowLabel="March–April 2027"
      />,
    );
    const name = screen.getByText("Bangkok 2027");
    expect(name).toHaveAttribute("title", "Bangkok 2027");
  });

  it("short trip name is not truncated", () => {
    render(
      <CommandBar
        tripName="Bangkok"
        dateWindowLabel="March–April 2027"
      />,
    );
    expect(screen.getByText("Bangkok")).toBeInTheDocument();
  });
});
