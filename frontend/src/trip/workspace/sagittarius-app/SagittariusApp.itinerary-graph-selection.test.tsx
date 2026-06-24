import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import { seedTrip } from "@/src/trip/seed";
import { buildTripFixtureItineraryItem } from "@/src/trip/testing/fixtures/trip-fixtures";
import {
  installLocalStorageStub,
  persistTripDraft,
  render,
  resetSagittariusAppTestEnvironment,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit itinerary graph selection", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  it("keeps the right context drawer closed when selecting an activity from the graph", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const mainItem = buildTripFixtureItineraryItem({
      id: "graph-main-app",
      day: seedTrip.startDate,
      activity: "Graph app main",
      pathGroupId: "graph-app-group",
      pathRole: "main" as const,
    });
    const alternativeItem = {
      ...mainItem,
      id: "graph-alt-app",
      activity: "Graph app alternative",
      pathId: "path-2026-06-18-sub-a",
      pathName: "Plan A",
      pathRole: "alternative" as const,
    };
    persistTripDraft(storage, {
      ...seedTrip,
      itineraryItems: [mainItem, alternativeItem],
    });
    const { container } = render(<SagittariusApp initialView="itinerary" />);

    const graphButton = await screen.findByRole("button", {
      name: /Graph app alternative on Plan A/i,
    });
    await user.click(graphButton);

    expect(graphButton).toHaveClass("activity-path-graph-node--selected");
    expect(container.querySelector(".workspace-grid")).toHaveAttribute(
      "data-context-rail",
      "closed",
    );
    expect(
      screen.queryByRole("complementary", {
        name: /ข้อมูลประกอบการวางแผน/i,
      }),
    ).not.toBeInTheDocument();
  });
});
