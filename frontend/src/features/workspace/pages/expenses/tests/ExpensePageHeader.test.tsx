import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { getMessages } from "@/src/i18n/messages";
import { seedTrip } from "@/src/trip/seed";
import { ExpensePageHeader } from "../components/ExpensePageHeader";

describe("ExpensePageHeader", () => {
  it("renders localized trip metadata for editable expense pages", () => {
    render(
      <ExpensePageHeader
        canEditExpenses
        currentTripPlanId="plan-main"
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
    expect(screen.getByLabelText("แผนทริป")).toHaveValue("plan-main");
  });

  it("renders read-only edit status", () => {
    render(
      <ExpensePageHeader
        canEditExpenses={false}
        currentTripPlanId="plan-main"
        locale="en"
        t={getMessages("en")}
        trip={seedTrip}
      />,
    );

    expect(screen.getByText("Money view only")).toBeInTheDocument();
  });

  it("forwards trip plan changes from the header", async () => {
    const user = userEvent.setup();
    const onTripPlanChange = vi.fn();
    render(
      <ExpensePageHeader
        canEditExpenses
        currentTripPlanId="plan-main"
        locale="en"
        onTripPlanChange={onTripPlanChange}
        t={getMessages("en")}
        trip={seedTrip}
      />,
    );

    await user.selectOptions(screen.getByLabelText("Trip Plan"), "plan-rain");

    expect(onTripPlanChange).toHaveBeenCalledWith("plan-rain");
  });
});
