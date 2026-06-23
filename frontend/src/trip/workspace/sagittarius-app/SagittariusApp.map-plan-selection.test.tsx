import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import { tripRoutes } from "@/src/trip/workspace/sagittarius-app/support/route-patterns";
import {
  render,
  resetSagittariusAppTestEnvironment,
  tripWithPlans,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit map Trip Plan selection", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  it("keeps the map on the main Trip Plan when a backup plan is selected elsewhere", () => {
    window.history.replaceState(
      null,
      "",
      `${tripRoutes.map("trip-seed")}?tripPlanId=plan-variant-backup`,
    );
    const trip = {
      ...tripWithPlans(),
      itineraryItems: tripWithPlans().itineraryItems.map((item) =>
        item.planVariantId === "plan-variant-backup"
          ? { ...item, coordinates: undefined }
          : item,
      ),
    };

    render(<SagittariusApp initialView="map" initialTrip={trip} />);

    const map = screen.getByRole("region", { name: /แผนที่เส้นทาง/i });
    expect(within(map).queryByText("Rain plan gallery")).not.toBeInTheDocument();
    expect(screen.getByText(/1\/1 มีพิกัด/i)).toBeInTheDocument();
  });
});
