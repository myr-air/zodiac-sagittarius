import { describe, it, expect, vi, afterEach } from "vitest";
import { screen, fireEvent, cleanup } from "@testing-library/react";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { CompanionBottomNav } from "../CompanionBottomNav";

const labels = {
  now: "Now",
  map: "Map",
  checklist: "Checklist",
  expenses: "Expenses",
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("CompanionBottomNav", () => {
  it("renders 4 nav items", () => {
    renderWithI18n(<CompanionBottomNav activeTab="now" onTabChange={vi.fn()} labels={labels} />, { locale: "en" });
    expect(screen.getByTestId("bottom-nav-now")).toHaveTextContent("Now");
    expect(screen.getByTestId("bottom-nav-map")).toHaveTextContent("Map");
    expect(screen.getByTestId("bottom-nav-checklist")).toHaveTextContent("Checklist");
    expect(screen.getByTestId("bottom-nav-expenses")).toHaveTextContent("Expenses");
  });

  it("active tab has teal styling", () => {
    renderWithI18n(<CompanionBottomNav activeTab="now" onTabChange={vi.fn()} labels={labels} />, { locale: "en" });
    const active = screen.getByTestId("bottom-nav-now");
    expect(active).toHaveClass("text-(--color-primary)");
    expect(active).toHaveClass("border-t-2");
    expect(active).toHaveClass("border-(--color-primary)");
  });

  it("inactive tabs have muted text", () => {
    renderWithI18n(<CompanionBottomNav activeTab="now" onTabChange={vi.fn()} labels={labels} />, { locale: "en" });
    const inactive = screen.getByTestId("bottom-nav-map");
    expect(inactive).toHaveClass("text-(--color-text-muted)");
  });

  it("clicking tab calls onTabChange", () => {
    const onTabChange = vi.fn();
    renderWithI18n(<CompanionBottomNav activeTab="now" onTabChange={onTabChange} labels={labels} />, { locale: "en" });
    fireEvent.click(screen.getByTestId("bottom-nav-expenses"));
    expect(onTabChange).toHaveBeenCalledWith("expenses");
  });

  it("touch targets are at least 44px", () => {
    renderWithI18n(<CompanionBottomNav activeTab="now" onTabChange={vi.fn()} labels={labels} />, { locale: "en" });
    const item = screen.getByTestId("bottom-nav-now");
    expect(item).toHaveClass("min-w-[44px]");
    expect(item).toHaveClass("h-full");
  });
});
