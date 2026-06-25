import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderTripSettingsPage } from "../testing/support/render-trip-settings-page";

describe("TripSettingsPage", () => {
  it("uses calm cockpit surfaces for trip settings", () => {
    renderTripSettingsPage();

    const page = screen.getByRole("region", { name: "Trip settings" });
    expect(page).toHaveClass("trip-settings-page", "bg-transparent");
    expect(page.querySelector(".content-grid")).toHaveClass("gap-3");

    expect(screen.getByRole("heading", { name: "Trip settings", level: 1 }).closest("header")).toHaveClass(
      "page-header",
      "page-header--compact",
      "bg-(--color-surface)",
      "shadow-none",
      "trip-settings-header",
    );
    expect(page.querySelector(".page-header-meta")).toHaveClass("[&>span]:bg-(--color-surface-subtle)", "[&>span]:border-(--color-border)");
    expect(screen.getByRole("form", { name: "Trip details" })).toHaveClass("bg-(--color-surface)", "shadow-[0_1px_0_rgb(15_23_42_/_0.04)]");
    expect(screen.getByRole("region", { name: "Plan impact" })).toHaveClass("bg-(--color-surface)", "shadow-[0_1px_0_rgb(15_23_42_/_0.04)]");
  });

  it("normalizes trip settings before saving", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    renderTripSettingsPage({ onSave });

    fireEvent.change(screen.getByLabelText("Trip name"), {
      target: { value: " Summer trip " },
    });
    fireEvent.change(screen.getByLabelText("Destination"), {
      target: { value: " Hong Kong " },
    });
    fireEvent.change(screen.getByLabelText("Party size"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("Default timezone"), {
      target: { value: " Asia/Bangkok " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultTimezone: "Asia/Bangkok",
        destinationLabel: "Hong Kong",
        name: "Summer trip",
        partySize: 2,
      }),
    );
  });
});
