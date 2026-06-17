import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { seedTrip } from "@/src/trip/seed";
import { TripSettingsPage } from "./TripSettingsPage";

describe("TripSettingsPage", () => {
  it("uses calm cockpit surfaces for trip settings", () => {
    renderWithI18n(
      <TripSettingsPage
        canEdit
        currentMember={seedTrip.members[0]}
        trip={seedTrip}
        onSave={vi.fn()}
      />,
      { locale: "en" },
    );

    const page = screen.getByRole("region", { name: "Trip settings" });
    expect(page).toHaveClass("trip-settings-page", "bg-transparent");
    expect(page.querySelector(".content-grid")).toHaveClass("gap-3");

    expect(screen.getByRole("heading", { name: "Trip settings", level: 1 }).closest("header")).toHaveClass(
      "page-header",
      "bg-(--color-surface)",
      "shadow-[0_1px_0_rgb(15_23_42_/_0.04)]",
      "max-[767px]:hidden",
    );
    expect(page.querySelector(".page-header-meta")).toHaveClass("[&>span]:bg-(--color-surface-subtle)", "[&>span]:border-(--color-border)");
    expect(screen.getByRole("form", { name: "Trip details" })).toHaveClass("bg-(--color-surface)", "shadow-[0_1px_0_rgb(15_23_42_/_0.04)]");
    expect(screen.getByRole("region", { name: "Plan impact" })).toHaveClass("bg-(--color-surface)", "shadow-[0_1px_0_rgb(15_23_42_/_0.04)]");
  });
});
