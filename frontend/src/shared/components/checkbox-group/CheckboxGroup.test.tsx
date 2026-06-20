import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CheckboxGroup } from "./CheckboxGroup";

describe("CheckboxGroup", () => {
  it("does not render an empty fieldset", () => {
    const { container } = render(<CheckboxGroup label="Travelers" options={[]} selectedIds={[]} onToggle={() => undefined} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders selected options and reports toggled ids", () => {
    const onToggle = vi.fn();
    render(
      <CheckboxGroup
        label="Travelers"
        options={[
          { id: "member-1", label: "Nam" },
          { id: "member-2", label: "Kai" },
        ]}
        selectedIds={["member-1"]}
        onToggle={onToggle}
      />,
    );

    expect(screen.getByRole("group", { name: "Travelers" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Nam" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Kai" })).not.toBeChecked();

    fireEvent.click(screen.getByRole("checkbox", { name: "Kai" }));

    expect(onToggle).toHaveBeenCalledWith("member-2");
  });

  it("allows feature pages to choose a taller scroll region", () => {
    render(
      <CheckboxGroup
        label="Related itinerary"
        maxHeightClassName="max-h-48"
        options={[{ id: "stop-1", label: "1 · Victoria Peak" }]}
        selectedIds={[]}
        onToggle={() => undefined}
      />,
    );

    expect(screen.getByText("1 · Victoria Peak").closest("div")).toHaveClass("max-h-48");
  });
});
