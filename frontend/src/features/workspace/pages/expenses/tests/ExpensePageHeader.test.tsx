import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getMessages } from "@/src/i18n/messages";
import { seedTrip } from "@/src/trip/seed";
import { ExpensePageHeader } from "../components/ExpensePageHeader";

describe("ExpensePageHeader", () => {
  it("renders localized trip metadata for editable expense pages", () => {
    render(
      <ExpensePageHeader
        canEditExpenses
        locale="th"
        t={getMessages("th")}
        trip={seedTrip}
      />,
    );

    expect(screen.getByRole("heading", { name: "เงินทริป" })).toBeInTheDocument();
    expect(screen.getByText(seedTrip.name)).toBeInTheDocument();
    expect(screen.getByText(/18–23 มิ.ย. 2026/)).toBeInTheDocument();
    expect(screen.getByText(/5 สมาชิก/)).toBeInTheDocument();
    expect(screen.getByText("จัดการเงินได้")).toBeInTheDocument();
  });

  it("renders read-only edit status", () => {
    render(
      <ExpensePageHeader
        canEditExpenses={false}
        locale="en"
        t={getMessages("en")}
        trip={seedTrip}
      />,
    );

    expect(screen.getByText("Money view only")).toBeInTheDocument();
  });
});
