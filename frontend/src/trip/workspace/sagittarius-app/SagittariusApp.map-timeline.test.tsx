import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import { seedTrip } from "@/src/trip/seed";
import {
  tripRoutes,
} from "@/src/trip/workspace/sagittarius-app/support";
import {
  installLocalStorageStub,
  persistTripDraft,
  render,
  tripWithPlans,
  resetSagittariusAppTestEnvironment,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit map and timeline surfaces", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  it("keeps timeline selections separate from opening details while map day filters stay local", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<SagittariusApp initialView="timeline" />);

    await user.click(
      within(screen.getByRole("region", { name: /ไทม์ไลน์ทริป/i })).getByRole(
        "button",
        { name: /เลือกจุดในไทม์ไลน์ Victoria Peak/i },
      ),
    );
    expect(
      screen.queryByRole("complementary", {
        name: /ข้อมูลประกอบการวางแผน/i,
      }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /เปิดรายละเอียด/i }));
    expect(
      within(
        screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i }),
      ).getByRole("heading", { name: /Victoria Peak/i }),
    ).toBeInTheDocument();

    unmount();
    render(<SagittariusApp initialView="map" />);

    expect(
      screen.queryByRole("button", { name: /เปิดรายละเอียด/i }),
    ).not.toBeInTheDocument();
    await user.click(
      within(screen.getByRole("region", { name: /แผนที่เส้นทาง/i })).getByRole(
        "button",
        { name: /วันที่ 2/i },
      ),
    );
    expect(
      screen.queryByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/6\/16 มีพิกัด/i)).toBeInTheDocument();
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

  it("keeps the right context drawer closed when selecting an activity from the graph", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const mainItem = {
      ...seedTrip.itineraryItems[0],
      id: "graph-main-app",
      day: seedTrip.startDate,
      activity: "Graph app main",
      pathGroupId: "graph-app-group",
      pathRole: "main" as const,
    };
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
