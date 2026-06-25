import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import {
  installLocalStorageStub,
  persistTripDraft,
  render,
  resetSagittariusAppTestEnvironment,
  tripWithPlansAndPlanScopedRecords,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit local Trip Plan scoped records", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  it("shows plan-scoped records on secondary detail pages for the selected Trip Plan", async () => {
    const storage = installLocalStorageStub();
    persistTripDraft(storage, tripWithPlansAndPlanScopedRecords());

    const { unmount } = render(<SagittariusApp initialView="expenses" />);

    expect(
      (await screen.findAllByText("Backup gallery tickets")).length,
    ).toBeGreaterThan(0);
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

    expect((await screen.findAllByText("Backup gallery task")).length).toBeGreaterThan(0);
    expect(screen.queryByText("Main plan brunch task")).not.toBeInTheDocument();
  });
});
