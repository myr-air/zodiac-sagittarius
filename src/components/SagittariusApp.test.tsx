import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";

describe("Sagittarius cockpit UI", () => {
  it("opens directly into the planning cockpit instead of a marketing landing page", () => {
    render(<SagittariusApp />);

    expect(screen.getByRole("heading", { name: /Hong Kong \+ Shenzhen Trip/i })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /Sagittarius planning navigation/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Smart itinerary table/i })).toBeInTheDocument();
    expect(screen.queryByText(/hero/i)).not.toBeInTheDocument();
  });

  it("matches the dense planning cockpit skeleton from the reference", () => {
    render(<SagittariusApp />);

    expect(screen.getByRole("banner", { name: /Trip command bar/i })).toHaveClass("top-app-bar");
    expect(screen.getByRole("link", { name: /แผนการเดินทาง/i })).toHaveClass("rail-link--active");
    expect(screen.getByRole("tablist", { name: /Planning views/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Smart Itinerary Table/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("columnheader", { name: /^เวลา$/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /แผนที่ \/ ลิงก์/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Select stop Dim Dim Sum/i })).toBeInTheDocument();
  });

  it("collapses the left rail and keeps labels accessible", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp />);

    await user.click(screen.getByRole("button", { name: /Collapse navigation/i }));

    const nav = screen.getByRole("navigation", { name: /Sagittarius planning navigation/i });
    expect(nav).toHaveAttribute("data-collapsed", "true");
    expect(screen.getByRole("button", { name: /Expand navigation/i })).toHaveAttribute("aria-expanded", "false");
  });

  it("uses selected table row to drive the right context rail", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp />);

    await user.click(screen.getByRole("button", { name: /Select stop Victoria Peak/i }));

    const context = screen.getByRole("complementary", { name: /Planning context/i });
    expect(within(context).getByRole("heading", { name: /Victoria Peak/i })).toBeInTheDocument();
    expect(within(context).getAllByText(/The Peak Tram/i).length).toBeGreaterThan(0);
  });

  it("changes edit affordances by role capability", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp />);

    expect(screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i })).toBeEnabled();

    await user.selectOptions(screen.getByLabelText(/Role preview/i), "member-viewer");

    expect(screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i })).toBeDisabled();
    expect(screen.getByText(/editing requires organizer access/i)).toBeInTheDocument();
  });
});
