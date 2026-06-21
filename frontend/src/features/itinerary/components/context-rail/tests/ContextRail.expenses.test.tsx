import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import {
  renderContextRail,
  selectedContextRailItem,
} from "../testing/support/context-rail-render";

describe("ContextRail expenses", () => {
  it("creates, updates, and deletes stop expenses", () => {
    const props = renderContextRail({
      trip: {
        ...tripFixture.trip,
        expenses: [
          {
            id: "expense-dimdim-1",
            title: "Dim sum",
            amount: 240,
            paidBy: "member-aom",
            splits: {},
            category: "food",
            itineraryItemId: selectedContextRailItem.id,
            version: 1,
          },
        ],
      },
    });

    expect(
      screen.getByText(
        "ใช้เฉพาะเงินที่จ่ายแล้วหรือผูกพันต้องจ่าย ประมาณการให้เก็บใน booking draft หรือโน้ต",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("HK$240.00")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("ชื่อค่าใช้จ่ายจริง"), {
      target: { value: "Taxi" },
    });
    fireEvent.change(screen.getByLabelText("จำนวนเงิน"), {
      target: { value: "120" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "เพิ่ม/แก้ไขค่าใช้จ่ายจริง" }),
    );

    expect(props.onCreateExpense).toHaveBeenCalledWith({
      itemId: selectedContextRailItem.id,
      title: "Taxi",
      amount: 120,
      paidBy: tripFixture.currentMembers.owner.id,
      category: "food",
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Edit expense Dim sum/i }),
    );
    fireEvent.change(screen.getByLabelText("ชื่อค่าใช้จ่ายจริง"), {
      target: { value: "Dim sum edited" },
    });
    fireEvent.change(screen.getByLabelText("จำนวนเงิน"), {
      target: { value: "260" },
    });
    fireEvent.click(screen.getByRole("button", { name: "บันทึก" }));

    expect(props.onUpdateExpense).toHaveBeenCalledWith({
      expenseId: "expense-dimdim-1",
      title: "Dim sum edited",
      amount: 260,
      paidBy: "member-aom",
      category: "food",
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Delete expense Dim sum/i }),
    );
    expect(props.onDeleteExpense).toHaveBeenCalledWith("expense-dimdim-1");
  });
});
