import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InlineOptionPicker } from "@/src/features/itinerary/components/inline-option-picker";
import type { InlineOptionPickerOption } from "@/src/features/itinerary/components/inline-option-picker";

const options: InlineOptionPickerOption[] = [
  { value: "train", label: "Train" },
  { value: "taxi", label: "Taxi" },
];

describe("InlineOptionPicker", () => {
  it("opens and closes via outside click", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();

    render(
      <>
        <button type="button">Outside Button</button>
        <InlineOptionPicker
          ariaLabel="Ride type"
          value="train"
          options={options}
          onCommit={onCommit}
        />
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Ride type" }));
    expect(screen.getByRole("listbox", { name: "Ride type" })).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("button", { name: "Outside Button" }));
    expect(screen.queryByRole("listbox", { name: "Ride type" })).not.toBeInTheDocument();
  });

  it("commits selection when choosing an option", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();

    render(
      <InlineOptionPicker
        ariaLabel="Ride type"
        value="train"
        options={options}
        onCommit={onCommit}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Ride type" }));
    await user.click(screen.getByText("Taxi"));

    expect(onCommit).toHaveBeenCalledWith("taxi");
    expect(screen.queryByRole("listbox", { name: "Ride type" })).not.toBeInTheDocument();
  });
});
