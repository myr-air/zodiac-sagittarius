import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Select } from "@/src/ui";
import { SelectOptions } from "../SelectOptions";

describe("SelectOptions", () => {
  it("renders value and label pairs inside a select", () => {
    render(
      <Select aria-label="Trip Plan" defaultValue="plan-rain">
        <SelectOptions
          options={[
            { value: "plan-main", label: "Main" },
            { value: "plan-rain", label: "Rain plan" },
          ]}
        />
      </Select>,
    );

    expect(screen.getByRole("combobox", { name: "Trip Plan" })).toHaveValue("plan-rain");
    expect(screen.getByRole("option", { name: "Main" })).toHaveValue("plan-main");
    expect(screen.getByRole("option", { name: "Rain plan" })).toHaveValue("plan-rain");
  });

  it("keeps an empty option owned by the caller", () => {
    render(
      <Select aria-label="Owner" defaultValue="">
        <option value="">No owner</option>
        <SelectOptions options={[{ value: "member-aom", label: "Aom" }]} />
      </Select>,
    );

    expect(screen.getByRole("option", { name: "No owner" })).toHaveValue("");
    expect(screen.getByRole("option", { name: "Aom" })).toHaveValue("member-aom");
  });

  it("passes disabled state through to generated options", () => {
    render(
      <Select aria-label="Status" defaultValue="draft">
        <SelectOptions
          options={[
            { value: "main", label: "Main", disabled: true },
            { value: "draft", label: "Draft" },
          ]}
        />
      </Select>,
    );

    expect(screen.getByRole("option", { name: "Main" })).toBeDisabled();
    expect(screen.getByRole("option", { name: "Draft" })).not.toBeDisabled();
  });
});
