import {
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import {
  SagittariusApp,
} from "@/src/app/SagittariusApp";
import { tripStorageKey } from "@/src/trip/repository";
import { seedTrip } from "@/src/trip/seed";
import type {
  Trip,
} from "@/src/trip/types";
import {
  appRoutes,
} from "@/src/trip/workspace/sagittarius-app/support";
import {
  installLocalStorageStub,
  installSessionStorageStub,
  openItineraryHeaderControls,
  render,
  tripWithPlans,
  tripWithPlansAndPlanScopedRecords,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit Trip Plans", () => {
  beforeEach(() => {
    installLocalStorageStub();
    installSessionStorageStub();
    window.history.pushState(null, "", appRoutes.home());
  });

  it("creates a named local Trip Plan and selects it without copying itinerary rows", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await openItineraryHeaderControls(user);
    const selector = (await screen.findByLabelText(
      "Trip Plan",
    )) as HTMLSelectElement;
    await user.click(screen.getByRole("button", { name: "เพิ่มแผน" }));
    await user.type(screen.getByPlaceholderText("ตั้งชื่อแผน"), "Museum Day");
    await user.click(screen.getByRole("button", { name: "สร้างแผน" }));

    await waitFor(() =>
      expect(screen.getByLabelText("Trip Plan")).toHaveDisplayValue(
        "Museum Day - ร่าง",
      ),
    );
    expect(selector).toHaveValue(
      (screen.getByRole("option", { name: "Museum Day - ร่าง" }) as HTMLOptionElement)
        .value,
    );
    expect(
      screen.queryByRole("row", { name: /Dim Dim Sum/i }),
    ).not.toBeInTheDocument();
    const persistedTrip = JSON.parse(
      window.localStorage.getItem(tripStorageKey)!,
    ) as Trip;
    expect(persistedTrip.activePlanVariantId).toBe(seedTrip.activePlanVariantId);
    expect(persistedTrip.mainTripPlanId).toBe(
      seedTrip.mainTripPlanId ?? seedTrip.activePlanVariantId,
    );
    expect(persistedTrip.planVariants).toEqual(persistedTrip.tripPlans);
    expect(
      persistedTrip.planVariants.find((plan) => plan.id === selector.value),
    ).toMatchObject({ kind: "draft", status: "draft" });
  });

  it("switches local Trip Plans and changes visible itinerary rows by planVariantId", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const draftTrip = tripWithPlans();
    storage.setItem(tripStorageKey, JSON.stringify(draftTrip));

    render(<SagittariusApp initialView="itinerary" />);

    await openItineraryHeaderControls(user);
    await screen.findByRole("option", { name: "Rain Plan - ร่าง" });
    await screen.findByRole("row", { name: /Dim Dim Sum/i });
    await user.selectOptions(screen.getByLabelText("Trip Plan"), [
      "plan-variant-backup",
    ]);

    expect(
      await screen.findByRole("row", { name: /Rain plan gallery/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("row", { name: /Dim Dim Sum/i }),
    ).not.toBeInTheDocument();
    const persistedTrip = JSON.parse(storage.getItem(tripStorageKey)!) as Trip;
    expect(persistedTrip.activePlanVariantId).toBe(draftTrip.activePlanVariantId);
    expect(persistedTrip.mainTripPlanId).toBe(draftTrip.mainTripPlanId);
    expect(persistedTrip.planVariants).toEqual(persistedTrip.tripPlans);
    expect(
      persistedTrip.planVariants.find(
        (plan) => plan.id === "plan-variant-backup",
      ),
    ).toMatchObject({ kind: "draft", status: "draft" });
    expect(window.location.search).toContain("tripPlanId=plan-variant-backup");
  });

  it("preserves the selected Trip Plan across reload-style remounts", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const draftTrip = tripWithPlans();
    storage.setItem(tripStorageKey, JSON.stringify(draftTrip));

    const { unmount } = render(<SagittariusApp initialView="itinerary" />);

    await openItineraryHeaderControls(user);
    await screen.findByRole("option", { name: "Rain Plan - ร่าง" });
    await user.selectOptions(screen.getByLabelText("Trip Plan"), [
      "plan-variant-backup",
    ]);
    expect(
      await screen.findByRole("row", { name: /Rain plan gallery/i }),
    ).toBeInTheDocument();

    unmount();
    render(<SagittariusApp initialView="itinerary" />);

    await openItineraryHeaderControls(user);
    await waitFor(() =>
      expect(screen.getByLabelText("Trip Plan")).toHaveValue(
        "plan-variant-backup",
      ),
    );
    expect(
      await screen.findByRole("row", { name: /Rain plan gallery/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("row", { name: /Dim Dim Sum/i }),
    ).not.toBeInTheDocument();
  });

  it("sets the selected local Trip Plan as Main only from the explicit action", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const draftTrip = tripWithPlans();
    storage.setItem(tripStorageKey, JSON.stringify(draftTrip));

    render(<SagittariusApp initialView="itinerary" />);

    await openItineraryHeaderControls(user);
    await screen.findByRole("option", { name: "Rain Plan - ร่าง" });
    await user.selectOptions(screen.getByLabelText("Trip Plan"), [
      "plan-variant-backup",
    ]);
    await user.click(screen.getByRole("button", { name: "ใช้เป็นแผนหลัก" }));

    await waitFor(() => {
      const persistedTrip = JSON.parse(storage.getItem(tripStorageKey)!) as Trip;
      expect(persistedTrip.activePlanVariantId).toBe("plan-variant-backup");
      expect(persistedTrip.mainTripPlanId).toBe("plan-variant-backup");
      expect(
        persistedTrip.planVariants.find(
          (plan) => plan.id === "plan-variant-backup",
        ),
      ).toMatchObject({ kind: "main", status: "main" });
      expect(
        persistedTrip.planVariants.find(
          (plan) => plan.id === seedTrip.activePlanVariantId,
        ),
      ).toMatchObject({ kind: "backup", status: "backup" });
    });
  });

  it("shows plan-scoped records on secondary detail pages for the selected Trip Plan", async () => {
    const storage = installLocalStorageStub();
    storage.setItem(
      tripStorageKey,
      JSON.stringify(tripWithPlansAndPlanScopedRecords()),
    );

    const { unmount } = render(<SagittariusApp initialView="expenses" />);

    expect(
      await screen.findByText("Backup gallery tickets"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Main plan dim sum receipt"),
    ).not.toBeInTheDocument();

    unmount();
    render(<SagittariusApp initialView="bookings" />);

    expect(
      (await screen.findAllByText("Backup gallery ticket booking")).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("1 รายการ").length).toBeGreaterThan(0);
    expect(
      screen.queryByText("Main plan brunch booking"),
    ).not.toBeInTheDocument();
  });

  it("shows selected Trip Plan tasks on overview instead of tasks from other plans", async () => {
    const trip = tripWithPlansAndPlanScopedRecords();

    render(<SagittariusApp initialTrip={trip} initialView="overview" />);

    expect(await screen.findByText("Backup gallery task")).toBeInTheDocument();
    expect(screen.queryByText("Main plan brunch task")).not.toBeInTheDocument();
  });


});
