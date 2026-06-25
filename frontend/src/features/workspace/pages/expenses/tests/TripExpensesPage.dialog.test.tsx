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

    await user.click(screen.getByRole("button", { name: /เพิ่มรายการ/i }));
    const dialog = screen.getByRole("dialog", { name: /เพิ่มค่าใช้จ่าย/i });
    expect(within(dialog).getByRole("heading", { name: /ข้อมูลบิล/i })).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: /ทริป คนจ่าย และการแบ่ง/i })).toBeInTheDocument();
    expect(within(dialog).getByRole("group", { name: /ตรวจแล้วบันทึก/i })).not.toHaveClass("sticky");
    expect(within(dialog).getByRole("group", { name: /ตรวจแล้วบันทึก/i })).toHaveClass("border-t");
    await user.type(within(dialog).getByLabelText(/ชื่อค่าใช้จ่าย/i), "Hotel night");
    await user.clear(within(dialog).getByLabelText(/จำนวนเงิน/i));
    await user.type(within(dialog).getByLabelText(/จำนวนเงิน/i), "1800");
    await user.click(within(dialog).getByRole("button", { name: /โน้ต.*ลิงก์ใบเสร็จ/i }));
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

  it("opens quick personal accounting with the current member as the only split", async () => {
    const user = userEvent.setup();
    const props = renderExpenses();

    await user.click(screen.getAllByRole("button", { name: /คำสั่ง/i })[0]);
    await user.click(screen.getByRole("button", { name: /บันทึกใช้จ่ายส่วนตัว/i }));
    const dialog = screen.getByRole("dialog", { name: /เพิ่มค่าใช้จ่าย/i });
    expect(within(dialog).getByRole("button", { name: /ส่วนตัว/i })).toHaveAttribute("aria-pressed", "true");
    expect(within(dialog).getByLabelText(/จ่ายโดย/i)).toHaveValue("member-beam");

    await user.type(within(dialog).getByLabelText(/ชื่อค่าใช้จ่าย/i), "Personal coffee");
    await user.clear(within(dialog).getByLabelText(/จำนวนเงิน/i));
    await user.type(within(dialog).getByLabelText(/จำนวนเงิน/i), "75");
    await user.click(within(dialog).getByRole("button", { name: /บันทึกค่าใช้จ่าย/i }));

    expect(props.onCreateExpense).toHaveBeenCalledWith(expect.objectContaining({
      paidBy: "member-beam",
      splits: {
        "member-beam": 75,
      },
      title: "Personal coffee",
    }));
  });

  it("blocks duplicate expense submits while an async create is already pending", async () => {
    const user = userEvent.setup();
    let resolveCreate: (() => void) | undefined;
    const onCreateExpense = vi.fn(() => new Promise<void>((resolve) => {
      resolveCreate = resolve;
    }));
    renderExpenses({ onCreateExpense });

    await user.click(screen.getByRole("button", { name: /เพิ่มรายการ/i }));
    const dialog = screen.getByRole("dialog", { name: /เพิ่มค่าใช้จ่าย/i });
    await user.type(within(dialog).getByLabelText(/ชื่อค่าใช้จ่าย/i), "Double click lunch");
    await user.clear(within(dialog).getByLabelText(/จำนวนเงิน/i));
    await user.type(within(dialog).getByLabelText(/จำนวนเงิน/i), "120");
    const save = within(dialog).getByRole("button", { name: /บันทึกค่าใช้จ่าย/i });

    await user.dblClick(save);

    expect(onCreateExpense).toHaveBeenCalledTimes(1);
    expect(save).toBeDisabled();
    resolveCreate?.();
    await waitFor(() => expect(screen.queryByRole("dialog", { name: /เพิ่มค่าใช้จ่าย/i })).not.toBeInTheDocument());
  });

  it("uses the shared day and activity labels for linked stop options", async () => {
    const user = userEvent.setup();
    renderExpenses();

    await user.click(screen.getByRole("button", { name: /เพิ่มรายการ/i }));
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

    await user.click(screen.getByRole("tab", { name: /จัดการค่าใช้จ่าย/i }));
    await user.click(screen.getAllByRole("button", { name: /แก้ไข Dim sum receipt/i })[0]);
    const dialog = screen.getByRole("dialog", { name: /แก้ไขค่าใช้จ่าย/i });
    expect(dialog).toHaveTextContent("Receipt uploaded by Aom.");
    await user.type(within(dialog).getByLabelText(/เพิ่มโน้ต/i), "I'll transfer tonight.");
    await user.click(within(dialog).getByRole("button", { name: /เพิ่มโน้ต/i }));
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

    await user.click(screen.getByRole("tab", { name: /จัดการค่าใช้จ่าย/i }));
    await user.click(screen.getAllByRole("button", { name: /แก้ไข Dim Dim Sum brunch/i })[0]);
    const dialog = screen.getByRole("dialog", { name: /แก้ไขค่าใช้จ่าย/i });
    await user.click(within(dialog).getByRole("button", { name: /บันทึกค่าใช้จ่าย/i }));

    expect(screen.getByRole("dialog", { name: /แก้ไขค่าใช้จ่าย/i })).toBeInTheDocument();
    resolveUpdate?.();
    await waitFor(() => expect(screen.queryByRole("dialog", { name: /แก้ไขค่าใช้จ่าย/i })).not.toBeInTheDocument());
  });
});
