import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { screen, cleanup } from "@testing-library/react";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { CompanionDesktopFallback } from "../CompanionDesktopFallback";

vi.mock("qrcode", () => ({
  default: {
    toCanvas: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("CompanionDesktopFallback", () => {
  const baseProps = {
    tripUrl: "https://joii.app/trip/abc",
    todayActivities: [
      { id: "1", startTime: "09:00", activity: "Breakfast" },
      { id: "2", startTime: "10:30", activity: "City tour" },
      { id: "3", startTime: "12:00", activity: "Lunch" },
      { id: "4", startTime: "14:00", activity: "Museum visit" },
      { id: "5", startTime: "16:00", activity: "Coffee break" },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders today's activities list (up to 5)", () => {
    renderWithI18n(<CompanionDesktopFallback {...baseProps} />, { locale: "en" });

    expect(screen.getByTestId("activity-1")).toHaveTextContent("09:00Breakfast");
    expect(screen.getByTestId("activity-2")).toHaveTextContent("10:30City tour");
    expect(screen.getByTestId("activity-3")).toHaveTextContent("12:00Lunch");
    expect(screen.getByTestId("activity-4")).toHaveTextContent("14:00Museum visit");
    expect(screen.getByTestId("activity-5")).toHaveTextContent("16:00Coffee break");
  });

  it("shows '+N more' when more than 5 activities", () => {
    const activities = [
      ...baseProps.todayActivities,
      { id: "6", startTime: "18:00", activity: "Dinner" },
      { id: "7", startTime: "20:00", activity: "Night walk" },
    ];

    renderWithI18n(<CompanionDesktopFallback {...baseProps} todayActivities={activities} />, { locale: "en" });

    expect(screen.getByTestId("more-activities-message")).toHaveTextContent("+2 more");
  });

  it("shows 'No activities today' when empty", () => {
    renderWithI18n(<CompanionDesktopFallback {...baseProps} todayActivities={[]} />, { locale: "en" });

    expect(screen.getByTestId("no-activities-message")).toHaveTextContent("No activities today");
  });

  it("renders QR code canvas", () => {
    renderWithI18n(<CompanionDesktopFallback {...baseProps} />, { locale: "en" });

    const canvas = screen.getByTestId("companion-qr-canvas");
    expect(canvas).toBeInTheDocument();
    expect(canvas.tagName).toBe("CANVAS");
  });

  it("shows 'Open on mobile' heading", () => {
    renderWithI18n(<CompanionDesktopFallback {...baseProps} />, { locale: "en" });

    expect(screen.getByRole("heading", { name: "Open on mobile" })).toBeInTheDocument();
  });

  it("shows muted explanation text", () => {
    renderWithI18n(<CompanionDesktopFallback {...baseProps} />, { locale: "en" });

    expect(screen.getByTestId("desktop-description")).toHaveTextContent(
      "The trip companion is designed for mobile devices.",
    );
  });
});
