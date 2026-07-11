import {
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import {
  SagittariusApp,
} from "@/src/app/SagittariusApp";
import { seedTrip } from "@/src/trip/seed";
import {
  render,
  resetSagittariusAppTestEnvironment,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit view surfaces", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
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

  it("renders the group-wrangler workspace surface", () => {
    const { container } = render(<SagittariusApp accessMode="trip-access" dataSource="local" initialView="group-wrangler" routeTripId={seedTrip.id} />);
    // The group-wrangler view should render its members section
    expect(container.querySelector('[aria-label="กลุ่ม"]')).toBeTruthy();
  });

  it("renders the on-trip-companion workspace surface", () => {
    const { container } = render(<SagittariusApp accessMode="trip-access" dataSource="local" initialView="on-trip-companion" routeTripId={seedTrip.id} />);
    expect(container.querySelector('[data-testid="companion-bottom-nav"]')).toBeTruthy();
  });
});
