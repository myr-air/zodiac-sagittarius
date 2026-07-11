import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { OfflineBanner } from "../OfflineBanner";

describe("OfflineBanner", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", { onLine: true });
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not render when online", () => {
    renderWithI18n(<OfflineBanner />, { locale: "en" });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders when offline", () => {
    vi.stubGlobal("navigator", { onLine: false });
    renderWithI18n(<OfflineBanner />, { locale: "en" });
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/Offline/)).toBeInTheDocument();
  });

  it("hides when dismissed", () => {
    vi.stubGlobal("navigator", { onLine: false });
    renderWithI18n(<OfflineBanner />, { locale: "en" });
    fireEvent.click(screen.getByLabelText(/Close/));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("uses aria-live polite", () => {
    vi.stubGlobal("navigator", { onLine: false });
    renderWithI18n(<OfflineBanner />, { locale: "en" });
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });
});
