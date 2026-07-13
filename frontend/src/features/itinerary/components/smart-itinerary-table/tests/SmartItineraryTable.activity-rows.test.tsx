import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  renderSmartItineraryTable,
} from "@/src/features/itinerary/testing";

const renderTable = renderSmartItineraryTable;

describe("SmartItineraryTable", () => {
  it("renders graph and compact activity cells for activity rows", () => {
    renderTable();

    const table = document.querySelector(".smart-table");
    expect(table).toHaveClass("smart-table", "min-w-[520px]");
    expect(screen.getByRole("columnheader", { name: "Path graph" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Activity" })).toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", {
        name: /เวลา|Time|place|Type|Map|Actions|ประเภท|จัดการ/i,
      }),
    ).not.toBeInTheDocument();

    const itemRows = document.querySelectorAll<HTMLTableRowElement>(
      ".item-placeholder-row[data-item-id]",
    );
    expect(itemRows.length).toBeGreaterThan(0);
    for (const row of itemRows) {
      expect(row.querySelector(".item-placeholder-cell")).toBeInTheDocument();
      expect(row.querySelector(".activity-cell")).toBeInTheDocument();
      expect(row.textContent?.trim()).not.toBe("");
      expect(
        within(row).getByRole("button", {
          name: /เปิดรายละเอียดของ|Open details for/i,
        }),
      ).toBeInTheDocument();
      expect(
        within(row).getAllByRole("button", {
          name: /แก้ไขประเภท|Edit type/i,
        }).length,
      ).toBeGreaterThanOrEqual(1);
    }
    expect(itemRows[0]?.querySelector(".activity-cell")).toHaveAttribute(
      "data-selected",
      "true",
    );
    expect(
      itemRows[0]?.querySelector(".activity-cell"),
    ).toHaveClass(
      "min-h-[60px]",
      "grid-cols-[80px_112px_minmax(0,1fr)]",
      "data-[selected=true]:bg-(--color-route-soft)",
    );
    expect(
      within(itemRows[0]).getByRole("button", {
        name: /เปิดรายละเอียดของ|Open details for/i,
      }),
    ).toHaveClass("size-11");
    expect(
      within(itemRows[0]).getAllByRole("button", {
        name: /แก้ไขประเภท|Edit type/i,
      }).find((button) => button.className.includes("activity-type-picker ")),
    ).toHaveClass(
      "activity-type-picker",
      "!min-h-[52px]",
  "rounded-(--radius-sm)",
    );
    expect(
      within(itemRows[0]).getAllByRole("button", {
        name: /แก้ไขประเภท|Edit type/i,
      })[0]?.querySelector(".icon"),
    ).toBeInTheDocument();
    const subActivityToggle = within(itemRows[0]).getAllByRole("button", {
      name: /Sub-activities for/i,
    })[0];
    expect(subActivityToggle).toHaveClass("size-7");
    expect(subActivityToggle).toHaveAttribute("aria-expanded", "false");
    expect(itemRows[0]?.querySelector(".sub-activity-list")).toBeInTheDocument();
    expect(
      within(itemRows[0]).getByRole("button", {
        name: /Add sub-activity|เพิ่มกิจกรรมย่อย/i,
      }),
    ).toBeInTheDocument();
    const rowWithoutSubItems = Array.from(itemRows).find(
      (row) =>
        row !== itemRows[0] &&
        within(row).queryByRole("button", {
          name: /Add sub-activity|เพิ่มกิจกรรมย่อย/i,
        }) === null,
    );
    expect(rowWithoutSubItems).toBeDefined();

    expect(
      screen.queryByRole("region", { name: /รายละเอียดจุดที่เลือก/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(subActivityToggle);
    expect(subActivityToggle).toHaveAttribute("aria-expanded", "true");
    expect(itemRows[0]?.querySelector(".sub-activity-list")).toHaveClass(
      "max-[640px]:hidden",
    );
  });

});
