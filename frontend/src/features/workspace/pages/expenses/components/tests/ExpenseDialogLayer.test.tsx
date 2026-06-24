import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { seedTrip } from "@/src/trip/seed";
import { ExpenseDialogLayer } from "../ExpenseDialogLayer";

const baseProps = {
  apiBaseUrl: "",
  currentMember: seedTrip.members[1],
  selectedTripPlanId: null,
  settlementCurrency: "THB",
  trip: seedTrip,
  onClose: vi.fn(),
  onCreateExpense: vi.fn(),
  onUpdateExpense: vi.fn(),
};

describe("ExpenseDialogLayer", () => {
  it("does not render a dialog without an active expense target", () => {
    render(<ExpenseDialogLayer {...baseProps} dialogExpense={null} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders create dialog for a new expense target", () => {
    renderWithI18n(
      <ExpenseDialogLayer {...baseProps} dialogExpense="new" />,
      { locale: "th" },
    );

    expect(
      screen.getByRole("dialog", { name: /เพิ่มค่าใช้จ่าย/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/ชื่อค่าใช้จ่าย/i)).toBeInTheDocument();
  });
});
