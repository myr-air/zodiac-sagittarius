import {
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import { seedTrip } from "@/src/trip/seed";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import {
  installLocalStorageStub,
  installSessionStorageStub,
  render,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit members", () => {
  beforeEach(() => {
    installLocalStorageStub();
    installSessionStorageStub();
    window.history.pushState(null, "", appRoutes.home());
  });

  it("renders trip members as their own workspace page", () => {
    render(<SagittariusApp initialView="members" />);

    const navigation = screen.getByRole("navigation", {
      name: /เมนูวางแผน Joii/i,
    });
    const membersLink = within(navigation).getByRole("link", {
      name: /สมาชิก/i,
    });

    expect(membersLink).toHaveClass("rail-link--active");
    expect(membersLink).toHaveAttribute(
      "href",
      appRoutes.tripMembers(seedTrip.id),
    );
    expect(
      screen.getByRole("region", { name: /สมาชิกทริป/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: /People and presence/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /สมาชิกในทริป/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /ตารางแผนการเดินทาง/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /แผนที่เส้นทาง/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /ไทม์ไลน์ทริป/i }),
    ).not.toBeInTheDocument();
  });

  it("renders members with a single page header and without itinerary-only controls", () => {
    const { container } = render(<SagittariusApp initialView="members" />);
    const workspaceGrid = container.querySelector(".workspace-grid");
    const planningMain = container.querySelector(".planning-main");

    expect(
      screen.queryByRole("banner", { name: /Trip command bar/i }),
    ).not.toBeInTheDocument();
    expect(container.querySelector(".page-header")).toHaveTextContent(
      "Hong Kong + Shenzhen Trip",
    );
    expect(container.querySelector(".page-header")).toHaveTextContent(
      "18–23 มิ.ย. 2026",
    );
    expect(workspaceGrid).toBeInTheDocument();
    expect(workspaceGrid).toHaveAttribute("data-command-bar", "hidden");
    expect(workspaceGrid).toContainElement(planningMain as HTMLElement);
    expect(planningMain).toContainElement(
      screen.getByRole("region", { name: /สมาชิกทริป/i }),
    );
    expect(
      screen.queryByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i }),
    ).not.toBeInTheDocument();
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
  });

  it("shows the current member as confirmed on the members page", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="members" />);

    const currentMemberRow = screen
      .getByText(/Demo Traveler \(คุณ\)/i)
      .closest(".person-row");
    expect(currentMemberRow).not.toBeNull();
    expect(
      within(currentMemberRow as HTMLElement).getByText(/ยืนยันแล้ว/i),
    ).toBeInTheDocument();
    expect(
      within(currentMemberRow as HTMLElement).queryByText(/รอเข้าร่วม/i),
    ).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/^สถานะ$/i), "pending");

    expect(
      screen.queryByText(/Demo Traveler \(คุณ\)/i),
    ).not.toBeInTheDocument();
  });

  it("filters trip members and can reset an empty member search", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="members" />);

    await user.type(screen.getByLabelText(/ค้นหาสมาชิก/i), "Family");

    const membersPage = screen.getByRole("region", { name: /สมาชิกทริป/i });
    expect(
      within(membersPage).getByRole("button", {
        name: /ปิดสิทธิ์ Family Member/i,
      }),
    ).toBeInTheDocument();
    expect(
      within(membersPage).queryByText(/Travel Mate/i),
    ).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/^สิทธิ์$/i), "organizer");

    expect(
      screen.getByText(/ไม่พบสมาชิกที่ตรงกับตัวกรอง/i),
    ).toBeInTheDocument();

    await user.click(
      screen.getAllByRole("button", { name: /ล้างตัวกรอง/i })[0],
    );

    expect(
      screen.getByRole("button", { name: /ปิดสิทธิ์ Travel Mate/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /ปิดสิทธิ์ Explorer Friend/i }),
    ).toBeInTheDocument();
  });

});
