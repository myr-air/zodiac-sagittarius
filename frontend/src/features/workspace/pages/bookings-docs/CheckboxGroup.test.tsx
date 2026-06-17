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
});
