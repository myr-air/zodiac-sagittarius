import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DayTitleEditor } from "../day-title-editor";

describe("DayTitleEditor", () => {
  it("saves trimmed title on blur", async () => {
    const user = userEvent.setup();
    const onSaveDayTitle = vi.fn();

    render(
      <DayTitleEditor
        canEdit
        date="2026-06-19"
        dayLabel="Day 2"
        defaultTitle="Day 2"
        title="Old title"
        version={7}
        onSaveDayTitle={onSaveDayTitle}
      />,
    );

    const input = screen.getByLabelText("Trip day title for Day 2");
    await user.clear(input);
    await user.type(input, "Shenzhen border hop");
    await user.tab();

    await waitFor(() => {
      expect(onSaveDayTitle).toHaveBeenCalledWith(
        "2026-06-19",
        7,
        "Shenzhen border hop",
      );
    });
  });

  it("reverts to source value on Escape", async () => {
    const user = userEvent.setup();
    const onSaveDayTitle = vi.fn();

    render(
      <DayTitleEditor
        canEdit
        date="2026-06-19"
        dayLabel="Day 2"
        defaultTitle="Day 2"
        title="Old title"
        version={7}
        onSaveDayTitle={onSaveDayTitle}
      />,
    );

    const input = screen.getByLabelText("Trip day title for Day 2");
    await user.clear(input);
    await user.type(input, "Drafting");
    await user.keyboard("{Escape}");

    expect(input).toHaveValue("Old title");
    expect(onSaveDayTitle).not.toHaveBeenCalled();
  });
});
