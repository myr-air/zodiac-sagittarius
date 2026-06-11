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

    expect(screen.getByRole("heading", { name: "Trip settings", level: 1 }).closest("header")).toHaveClass(
      "bg-(--color-surface)",
      "shadow-[0_10px_22px_rgb(55_47_38_/_0.045)]",
    );
    expect(page.querySelector("header span")).toHaveClass(
      "bg-(--color-primary-soft)",
      "text-(--color-primary-strong)",
    );
    expect(screen.getByRole("form", { name: "Trip details" })).toHaveClass("bg-(--color-surface)");
    expect(screen.getByRole("complementary", { name: "Plan impact" })).toHaveClass("bg-(--color-surface)");
  });
});
