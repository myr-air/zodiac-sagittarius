import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildExpenseSummary } from "@/src/trip/expenses";
import { seedTrip } from "@/src/trip/seed";
import { renderExpenses } from "../testing/support/render-expenses-page";

describe("TripExpensesPage edit dialog", () => {
  afterEach(() => {
    window.localStorage?.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("captures notes and repeat count for multi-day travel expenses", async () => {
    const user = userEvent.setup();
    const props = renderExpenses();

    await user.click(screen.getByRole("button", { name: /เพิ่มค่าใช้จ่าย/i }));
    const dialog = screen.getByRole("dialog", { name: /เพิ่มค่าใช้จ่าย/i });
    await user.type(within(dialog).getByLabelText(/ชื่อค่าใช้จ่าย/i), "Hotel night");
    await user.clear(within(dialog).getByLabelText(/จำนวนเงิน/i));
    await user.type(within(dialog).getByLabelText(/จำนวนเงิน/i), "1800");
    await user.type(within(dialog).getByLabelText(/โน้ต/i), "Room 1207, includes deposit.");
    await user.clear(within(dialog).getByLabelText(/ทำซ้ำ/i));
    await user.type(within(dialog).getByLabelText(/ทำซ้ำ/i), "3");
    await user.click(within(dialog).getByRole("button", { name: /บันทึกค่าใช้จ่าย/i }));

    expect(props.onCreateExpense).toHaveBeenCalledWith(expect.objectContaining({
      title: "Hotel night",
      amount: 1800,
      notes: "Room 1207, includes deposit.",
      repeatCount: 3,
    }));
  });

  it("uses the shared day and activity labels for linked stop options", async () => {
    const user = userEvent.setup();
    renderExpenses();

    await user.click(screen.getByRole("button", { name: /เพิ่มค่าใช้จ่าย/i }));
    const dialog = screen.getByRole("dialog", { name: /เพิ่มค่าใช้จ่าย/i });
    expect(within(dialog).getByRole("option", {
      name: "2026-06-18 · ถึง Hong Kong International Airport",
    })).toHaveValue("item-arrive-hkg");
  });

  it("adds a comment to an existing expense before saving edits", async () => {
    const user = userEvent.setup();
    const trip = {
      ...seedTrip,
      expenses: [
        {
          ...seedTrip.expenses[0],
          id: "expense-commented",
          title: "Dim sum receipt",
          comments: [
            {
              id: "comment-existing",
              authorId: "member-aom",
              body: "Receipt uploaded by Aom.",
              createdAt: "2026-06-05T10:00:00.000Z",
            },
          ],
        },
      ],
    };
    const props = renderExpenses({
      trip,
      expenseSummary: buildExpenseSummary(trip.expenses, seedTrip.members[1].id),
    });

    await user.click(screen.getByRole("button", { name: /แก้ไข Dim sum receipt/i }));
    const dialog = screen.getByRole("dialog", { name: /แก้ไขค่าใช้จ่าย/i });
    expect(dialog).toHaveTextContent("Receipt uploaded by Aom.");
    await user.type(within(dialog).getByLabelText(/เพิ่ม comment/i), "I'll transfer tonight.");
    await user.click(within(dialog).getByRole("button", { name: /เพิ่ม comment/i }));
    await user.click(within(dialog).getByRole("button", { name: /บันทึกค่าใช้จ่าย/i }));

    expect(props.onUpdateExpense).toHaveBeenCalledWith(expect.objectContaining({
      expenseId: "expense-commented",
      comments: [
        {
          id: "comment-existing",
          authorId: "member-aom",
          body: "Receipt uploaded by Aom.",
          createdAt: "2026-06-05T10:00:00.000Z",
        },
        {
          id: expect.any(String),
          authorId: "member-beam",
          body: "I'll transfer tonight.",
          createdAt: expect.any(String),
        },
      ],
    }));
  });

  it("keeps the edit dialog open until an async expense update finishes", async () => {
    const user = userEvent.setup();
    let resolveUpdate: (() => void) | undefined;
    const onUpdateExpense = vi.fn(() => new Promise<void>((resolve) => {
      resolveUpdate = resolve;
    }));
    renderExpenses({ onUpdateExpense });

    await user.click(screen.getByRole("button", { name: /แก้ไข Dim Dim Sum brunch/i }));
    const dialog = screen.getByRole("dialog", { name: /แก้ไขค่าใช้จ่าย/i });
    await user.click(within(dialog).getByRole("button", { name: /บันทึกค่าใช้จ่าย/i }));

    expect(screen.getByRole("dialog", { name: /แก้ไขค่าใช้จ่าย/i })).toBeInTheDocument();
    resolveUpdate?.();
    await waitFor(() => expect(screen.queryByRole("dialog", { name: /แก้ไขค่าใช้จ่าย/i })).not.toBeInTheDocument());
  });
});
