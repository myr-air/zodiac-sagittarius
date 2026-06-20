import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import {
  render,
  resetSagittariusAppTestEnvironment,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit navigation rail", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  it("keeps the left navigation simple and only links to implemented views", () => {
    render(<SagittariusApp />);

    const navigation = screen.getByRole("navigation", {
      name: /เมนูวางแผน Joii/i,
    });
    const railLinks = navigation.querySelector(".rail-links");
    expect(railLinks).not.toBeNull();
    const links = within(railLinks as HTMLElement).getAllByRole("link");

    expect(links.map((link) => link.textContent?.trim())).toEqual([
      "ภาพรวม",
      "แผนการเดินทาง",
      "แผนที่",
      "ไทม์ไลน์",
      "ตั๋วและเอกสาร",
      "รูปภาพ",
      "สมาชิก",
      "ค่าใช้จ่าย",
      "ตั้งค่า",
    ]);
    expect(
      within(navigation).getByRole("link", { name: /ภาพรวม/i }),
    ).toHaveClass("rail-link--active");
    expect(
      within(navigation).queryByRole("link", { name: /งบประมาณ/i }),
    ).not.toBeInTheDocument();
    expect(
      within(navigation).getByRole("link", { name: /ตั๋วและเอกสาร/i }),
    ).toBeInTheDocument();
    expect(
      within(navigation).getByRole("link", { name: /รูปภาพ/i }),
    ).toBeInTheDocument();
    expect(
      within(navigation).getByRole("link", { name: /^ตั้งค่า$/ }),
    ).toBeInTheDocument();
  });

  it("can start on real route paths with the right surface first", () => {
    const { rerender } = render(<SagittariusApp initialView="map" />);

    const navigation = screen.getByRole("navigation", {
      name: /เมนูวางแผน Joii/i,
    });
    expect(
      within(navigation).getByRole("link", { name: /แผนที่/i }),
    ).toHaveClass("rail-link--active");
    expect(
      document.querySelector(".planning-main")?.firstElementChild,
    ).toHaveClass("route-map-panel");
    expect(
      screen.queryByRole("region", { name: /ตารางแผนการเดินทาง/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /ไทม์ไลน์ทริป/i }),
    ).not.toBeInTheDocument();

    rerender(<SagittariusApp initialView="timeline" />);

    expect(
      within(navigation).getByRole("link", { name: /ไทม์ไลน์/i }),
    ).toHaveClass("rail-link--active");
    expect(
      document.querySelector(".planning-main")?.firstElementChild,
    ).toHaveClass("timeline-panel");
    expect(
      screen.queryByRole("region", { name: /ตารางแผนการเดินทาง/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /แผนที่เส้นทาง/i }),
    ).not.toBeInTheDocument();
  });

  it("collapses the left rail and keeps labels accessible", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(screen.getByRole("button", { name: /ย่อเมนู/i }));

    const nav = screen.getByRole("navigation", { name: /เมนูวางแผน Joii/i });
    expect(nav).toHaveAttribute("data-collapsed", "true");
    expect(screen.getByRole("button", { name: /ขยายเมนู/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    await user.click(screen.getByRole("button", { name: /ขยายเมนู/i }));

    expect(nav).toHaveAttribute("data-collapsed", "false");
    expect(screen.getByRole("button", { name: /ย่อเมนู/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  }, 45_000);
});
