import {
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import {
  SagittariusApp,
} from "@/src/app/SagittariusApp";
import { tripParticipantSessionStorageKey } from "@/src/trip/auth";
import { tripStorageKey } from "@/src/trip/repository";
import { seedTrip } from "@/src/trip/seed";
import {
  appRoutes,
  tripRoutes,
} from "@/src/trip/workspace/sagittarius-app/support";
import {
  createApiClientForTrip,
  installLocalStorageStub,
  installSessionStorageStub,
  openItineraryHeaderControls,
  render,
  tripWithPlans,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit UI", () => {
  beforeEach(() => {
    installLocalStorageStub();
    installSessionStorageStub();
    window.history.pushState(null, "", appRoutes.home());
  });

  it("opens an empty trip timeline without a selected itinerary item", async () => {
    installLocalStorageStub();
    const emptyTrip = {
      ...seedTrip,
      id: "019e83ac-ed69-7df3-9354-b27359800374",
      itineraryItems: [],
      members: [
        {
          ...seedTrip.members[0],
          tripId: "019e83ac-ed69-7df3-9354-b27359800374",
        },
      ],
    };
    window.sessionStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: emptyTrip.id,
        memberId: emptyTrip.members[0].id,
        sessionToken: "empty-trip-session",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );

    render(
      <SagittariusApp
        accessMode="trip-access"
        initialView="timeline"
        requireJoin
        dataSource="api"
        routeTripId={emptyTrip.id}
        apiClient={createApiClientForTrip(emptyTrip)}
      />,
    );

    expect(
      await screen.findByRole("region", { name: /ไทม์ไลน์ทริป/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ไทม์ไลน์/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });


  it("renders the itinerary workspace as a graph plus compact activity cells", async () => {
    const user = userEvent.setup();
    const { container } = render(<SagittariusApp initialView="itinerary" />);

    expect(
      screen.queryByRole("banner", { name: /Trip command bar/i }),
    ).not.toBeInTheDocument();
    expect(document.querySelector(".page-header")).toHaveTextContent(
      "แผนการเดินทาง",
    );
    expect(screen.getByRole("link", { name: /แผนการเดินทาง/i })).toHaveClass(
      "rail-link--active",
    );
    expect(
      screen.getByRole("region", { name: /ตารางแผนการเดินทาง/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Path graph" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Activity" })).toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", {
        name: /เวลา|แผนที่ \/ ลิงก์|ประเภท|การเดินทาง|จัดการ/i,
      }),
    ).not.toBeInTheDocument();

    const itemRows = container.querySelectorAll<HTMLTableRowElement>(
      ".item-placeholder-row[data-item-id]",
    );
    expect(itemRows.length).toBeGreaterThan(0);
    for (const row of itemRows) {
      expect(row.querySelector(".item-placeholder-cell")).toBeInTheDocument();
      expect(row.querySelector(".activity-cell")).toBeInTheDocument();
      expect(row.textContent?.trim()).not.toBe("");
      expect(
        within(row).getByRole("button", { name: /เปิดรายละเอียดของ/i }),
      ).toBeInTheDocument();
      expect(within(row).queryByRole("combobox")).not.toBeInTheDocument();
    }

    expect(
      screen.queryByRole("button", { name: /^เลือกจุด /i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /เปิดรายละเอียดของ/i }).length,
    ).toBeGreaterThan(0);
    expect(container.querySelector(".workspace-grid")).toHaveAttribute(
      "data-context-rail",
      "closed",
    );

    const graphButton = screen.getByRole("button", {
      name: /Dim Dim Sum.* on Main/i,
    });
    await user.click(graphButton);
    expect(graphButton).toHaveClass("activity-path-graph-node--selected");
    expect(
      screen.queryByRole("complementary", {
        name: /ข้อมูลประกอบการวางแผน/i,
      }),
    ).not.toBeInTheDocument();
    expect(container.querySelector(".workspace-grid")).toHaveAttribute(
      "data-context-rail",
      "closed",
    );

    await user.click(
      within(itemRows[0]).getByRole("button", { name: /เปิดรายละเอียดของ/i }),
    );
    expect(
      screen.getByRole("complementary", {
        name: /ข้อมูลประกอบการวางแผน/i,
      }),
    ).toBeInTheDocument();
    expect(container.querySelector(".workspace-grid")).toHaveAttribute(
      "data-context-rail",
      "open",
    );
  });

  it("renders only the surface that belongs to the current URL view", () => {
    const { rerender } = render(<SagittariusApp initialView="itinerary" />);

    expect(
      screen.getByRole("region", { name: /ตารางแผนการเดินทาง/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /แผนที่เส้นทาง/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /ไทม์ไลน์ทริป/i }),
    ).not.toBeInTheDocument();

    rerender(<SagittariusApp initialView="map" />);

    const map = screen.getByRole("region", { name: /แผนที่เส้นทาง/i });
    expect(
      screen.queryByRole("region", { name: /ตารางแผนการเดินทาง/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /ไทม์ไลน์ทริป/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /เปิดรายละเอียด/i }),
    ).not.toBeInTheDocument();
    expect(
      within(map).getByRole("button", { name: /ทุกวัน/i }),
    ).toBeInTheDocument();
    expect(
      within(map).getByRole("button", { name: /วันที่ 2/i }),
    ).toBeInTheDocument();
    expect(
      within(map).queryByRole("button", { name: /โหลด OpenFreeMap/i }),
    ).not.toBeInTheDocument();
    expect(
      within(map).queryByRole("button", {
        name: /Select map stop Victoria Peak/i,
      }),
    ).not.toBeInTheDocument();
    expect(
      within(map).queryByRole("button", {
        name: /Select route stop Dim Dim Sum/i,
      }),
    ).not.toBeInTheDocument();

    rerender(<SagittariusApp initialView="timeline" />);

    const timeline = screen.getByRole("region", { name: /ไทม์ไลน์ทริป/i });

    expect(
      screen.queryByRole("region", { name: /ตารางแผนการเดินทาง/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /แผนที่เส้นทาง/i }),
    ).not.toBeInTheDocument();
    expect(
      within(timeline).getByRole("button", {
        name: /เลือกจุดในไทม์ไลน์ Dim Dim Sum/i,
      }),
    ).toBeInTheDocument();
    expect(within(timeline).getAllByText(/วันที่ 2/i).length).toBeGreaterThan(
      0,
    );
  });

  it("starts hydration from the join gate even when a remembered participant session exists", async () => {
    installLocalStorageStub();
    window.localStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: seedTrip.id,
        memberId: "member-aom",
        sessionToken: "local_hydration_test",
        createdAt: "2026-05-28T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );

    render(<SagittariusApp initialView="members" requireJoin />);

    expect(
      screen.getByRole("main", { name: /Account access/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: /เมนูวางแผน Joii/i }),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByRole("navigation", { name: /เมนูวางแผน Joii/i }),
    ).toBeInTheDocument();
  });

  it("cleans corrupt persisted drafts and participant sessions before opening", async () => {
    const storage = installLocalStorageStub();
    storage.setItem("sagittarius:trip-draft", "{");
    storage.setItem(tripParticipantSessionStorageKey, "{");

    render(<SagittariusApp requireJoin />);

    await waitFor(() => {
      expect(storage.getItem("sagittarius:trip-draft")).toBeNull();
      expect(storage.getItem(tripParticipantSessionStorageKey)).toBeNull();
    });
    expect(
      screen.getByRole("main", { name: /Account access/i }),
    ).toBeInTheDocument();
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
    storage.setItem(
      tripStorageKey,
      JSON.stringify({
        ...seedTrip,
        itineraryItems: [mainItem, alternativeItem],
      }),
    );
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

  it("changes edit affordances by role capability", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    expect(screen.queryByRole("button", { name: /นำเข้า|Import/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /ส่งออก|Export/i })).toBeNull();
    await openItineraryHeaderControls(user);
    expect(screen.getByRole("button", { name: "เพิ่มแผน" })).toBeEnabled();

    await user.selectOptions(
      screen.getByLabelText(/Role preview/i),
      "member-viewer",
    );

    expect(screen.queryByRole("button", { name: /นำเข้า|Import/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /ส่งออก|Export/i })).toBeNull();
    expect(screen.queryByRole("button", { name: "เพิ่มแผน" })).toBeNull();
    expect(
      screen.getByText(/ต้องมีสิทธิ์ผู้จัดทริปจึงจะแก้ไขได้/i),
    ).toBeInTheDocument();
  });

});
