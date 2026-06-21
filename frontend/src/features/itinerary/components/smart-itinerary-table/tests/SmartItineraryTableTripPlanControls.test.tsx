import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { messages } from "@/src/i18n/messages";
import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import { SmartItineraryTableTripPlanControls } from "../SmartItineraryTableTripPlanControls";

describe("SmartItineraryTableTripPlanControls", () => {
  const tripPlans = tripFixture.trip.planVariants;

  it("updates trip plan selection", async () => {
    const user = userEvent.setup();
    const onChangeTripPlan = vi.fn();
    const onRenameTripPlan = vi.fn();

    render(
      <SmartItineraryTableTripPlanControls
        canManageTripPlans
        itineraryLabels={messages.en.itinerary}
        isTripPlanBusy={false}
        mainTripPlanId={tripFixture.trip.activePlanVariantId}
        onChangeTripPlan={onChangeTripPlan}
        onChangeTripPlanStatus={vi.fn()}
        onCreateTripPlan={vi.fn()}
        onRenameTripPlan={onRenameTripPlan}
        onSetMainTripPlan={vi.fn()}
        selectedTripPlanId="plan-main"
        tripPlans={tripPlans}
      />,
    );

    await user.selectOptions(screen.getByLabelText("Trip Plan"), "plan-rain");
    expect(onChangeTripPlan).toHaveBeenCalledWith("plan-rain");
  });

  it("submits rename and create actions", async () => {
    const user = userEvent.setup();
    const onRenameTripPlan = vi.fn();
    const onCreateTripPlan = vi.fn();

    render(
      <SmartItineraryTableTripPlanControls
        canManageTripPlans
        itineraryLabels={messages.en.itinerary}
        isTripPlanBusy={false}
        mainTripPlanId={tripFixture.trip.mainTripPlanId ?? tripFixture.trip.activePlanVariantId}
        onChangeTripPlan={vi.fn()}
        onChangeTripPlanStatus={vi.fn()}
        onCreateTripPlan={onCreateTripPlan}
        onRenameTripPlan={onRenameTripPlan}
        onSetMainTripPlan={vi.fn()}
        selectedTripPlanId="plan-main"
        tripPlans={tripPlans}
      />,
    );

    const nameInput = screen.getByLabelText("Plan name");
    await user.clear(nameInput);
    await user.type(nameInput, "Main plan");
    await user.click(screen.getByRole("button", { name: "Save name" }));

    expect(onRenameTripPlan).toHaveBeenCalledWith("plan-main", "Main plan");

    await user.click(screen.getByRole("button", { name: "New plan" }));
    await user.type(screen.getByPlaceholderText("Name this plan"), "Weekend");
    await user.click(screen.getByRole("button", { name: "Create plan" }));

    expect(onCreateTripPlan).toHaveBeenCalledWith("Weekend");
  });

  it("hides create form for read-only plan management", () => {
    render(
      <SmartItineraryTableTripPlanControls
        canManageTripPlans={false}
        itineraryLabels={messages.en.itinerary}
        isTripPlanBusy={false}
        mainTripPlanId={tripFixture.trip.activePlanVariantId}
        onChangeTripPlan={vi.fn()}
        onChangeTripPlanStatus={vi.fn()}
        onCreateTripPlan={vi.fn()}
        onRenameTripPlan={vi.fn()}
        onSetMainTripPlan={vi.fn()}
        selectedTripPlanId={tripFixture.trip.activePlanVariantId}
        tripPlans={[tripFixture.trip.planVariants[0]]}
      />,
    );

    expect(screen.queryByRole("button", { name: "New plan" })).toBeNull();
    expect(screen.getByLabelText("Plan status")).toBeDisabled();
  });
});
