import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, screen, cleanup, waitFor } from "@testing-library/react";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { LocationSharingToggle } from "../LocationSharingToggle";

async function settle() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("LocationSharingToggle", () => {
  const baseProps = {
    isTripActive: true,
    tripEndDate: "2026-07-15",
    onToggle: vi.fn(),
    enabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("navigator", {
      ...navigator,
      permissions: {
        query: vi.fn().mockResolvedValue({ state: "prompt" }),
      },
      geolocation: {
        getCurrentPosition: vi.fn(),
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders toggle with location icon and label", async () => {
    const { container } = renderWithI18n(<LocationSharingToggle {...baseProps} />, { locale: "en" });
    await settle();

    expect(screen.getByText("Share location")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("toggle switch shows ON state when enabled=true", async () => {
    renderWithI18n(<LocationSharingToggle {...baseProps} enabled={true} />, { locale: "en" });
    await settle();

    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveClass("bg-(--color-primary)");
    expect(toggle).not.toHaveClass("bg-(--color-border-strong)");
  });

  it("toggle switch shows OFF state when enabled=false", async () => {
    renderWithI18n(<LocationSharingToggle {...baseProps} enabled={false} />, { locale: "en" });
    await settle();

    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveClass("bg-(--color-border-strong)");
    expect(toggle).not.toHaveClass("bg-(--color-primary)");
  });

  it("clicking toggle calls onToggle with opposite value", async () => {
    renderWithI18n(<LocationSharingToggle {...baseProps} enabled={false} />, { locale: "en" });

    fireEvent.click(screen.getByRole("switch"));
    await waitFor(() => expect(baseProps.onToggle).toHaveBeenCalledWith(true));

    cleanup();
    vi.clearAllMocks();

    renderWithI18n(<LocationSharingToggle {...baseProps} enabled={true} />, { locale: "en" });

    fireEvent.click(screen.getByRole("switch"));
    await waitFor(() => expect(baseProps.onToggle).toHaveBeenCalledWith(false));
  });

  it("disabled state when isTripActive=false (shows 'Trip ended')", async () => {
    renderWithI18n(<LocationSharingToggle {...baseProps} isTripActive={false} />, { locale: "en" });
    await settle();

    const toggle = screen.getByRole("switch");
    expect(toggle).toBeDisabled();
    expect(toggle).toHaveClass("cursor-not-allowed");
    expect(toggle).toHaveClass("opacity-50");
    expect(screen.getByTestId("trip-ended-message")).toHaveTextContent("Trip ended");
  });

  it("shows correct aria-checked attribute", async () => {
    renderWithI18n(<LocationSharingToggle {...baseProps} enabled={false} />, { locale: "en" });
    await settle();

    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");

    cleanup();

    renderWithI18n(<LocationSharingToggle {...baseProps} enabled={true} />, { locale: "en" });
    await settle();

    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("has role='switch'", async () => {
    renderWithI18n(<LocationSharingToggle {...baseProps} />, { locale: "en" });
    await settle();

    expect(screen.getByRole("switch")).toBeInTheDocument();
  });
});
