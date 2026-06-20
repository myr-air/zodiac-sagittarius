import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import {
  installLocalStorageStub,
  installSessionStorageStub,
  render,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit overview", () => {
  beforeEach(() => {
    installLocalStorageStub();
    installSessionStorageStub();
    window.history.pushState(null, "", appRoutes.home());
  });

  it("shows fallback daily weather briefings in the local overview", async () => {
    render(<SagittariusApp initialView="overview" />);

    const forecast = await screen.findByRole("region", {
      name: /พยากรณ์อากาศรายวัน/i,
    });
    expect(
      within(forecast).queryByText(/ยังไม่มีข้อมูลพยากรณ์อากาศ/i),
    ).not.toBeInTheDocument();
    expect(
      within(forecast).getAllByRole("button", { name: /Forecast pending/i })
        .length,
    ).toBeGreaterThan(0);
  });

  it("opens directly into the trip overview instead of a marketing landing page", () => {
    const { container } = render(<SagittariusApp />);
    const workspaceGrid = container.querySelector(".workspace-grid");
    const planningMain = container.querySelector(".planning-main");

    expect(
      screen.getAllByRole("heading", { name: /Hong Kong \+ Shenzhen Trip/i })
        .length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("navigation", { name: /เมนูวางแผน Joii/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("banner", { name: /Trip command bar/i }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText(/ศูนย์จัดการทริป/i).length).toBeGreaterThan(0);
    expect(workspaceGrid).toBeInTheDocument();
    expect(workspaceGrid).toContainElement(planningMain as HTMLElement);
    expect(container.querySelector(".workspace-shell")).toHaveClass("max-[1199px]:min-h-[calc(100dvh-48px)]");
    expect(planningMain).toHaveClass("max-[1199px]:min-h-[calc(100dvh-48px)]", "max-[1199px]:bg-(--color-surface)");
    expect(planningMain).toContainElement(
      screen.getByRole("region", { name: /Trip overview/i }),
    );
    expect(
      screen.getByRole("region", { name: /Trip overview/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryAllByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i }),
    ).toHaveLength(0);
    expect(
      screen.queryByRole("button", { name: /เปิดรายละเอียด/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /เลิกทำ/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /ทำซ้ำ/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /More actions/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /ตารางแผนการเดินทาง/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /แผนที่เส้นทาง/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /ไทม์ไลน์ทริป/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/hero/i)).not.toBeInTheDocument();
  });

});
