import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TripWorkspaceImportDialog } from "./TripWorkspaceImportDialog";
import type { ItineraryExportRecords } from "@/src/trip/itinerary-import-export";
import type { PlanVariant } from "@/src/trip/types";

const emptyRecords: ItineraryExportRecords = {
  bookingDocs: [],
  expenses: [],
  stopNotes: [],
  tasks: [],
};

const tripPlanOptions: PlanVariant[] = [
  {
    description: "",
    id: "plan-main",
    kind: "main",
    name: "Main Plan",
    status: "main",
    tripId: "trip-demo",
  },
  {
    description: "",
    id: "plan-rain",
    kind: "draft",
    name: "Rain Plan",
    status: "backup",
    tripId: "trip-demo",
  },
];

describe("TripWorkspaceImportDialog", () => {
  it("builds an import target from the selected trip plan and path options", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();

    render(
      <TripWorkspaceImportDialog
        currentTripPathId="path-rain"
        importedItems={[
          {
            activity: "Museum",
            day: "2026-06-19",
            id: "import-museum",
            activityType: "attraction",
            details: {},
            durationMinutes: 60,
            linkLabel: "",
            mapLink: "",
            note: "",
            place: "Central",
            sortOrder: 100,
            startTime: "10:00",
            transportation: "",
          },
        ]}
        memberId="member-aom"
        pathOptions={[
          { id: "main", name: "Main", scope: "trip" },
          { id: "path-rain", name: "Rain Route", scope: "trip" },
        ]}
        records={emptyRecords}
        startDate="2026-06-18"
        tripPlanId="plan-main"
        tripPlanOptions={tripPlanOptions}
        onApply={onApply}
        onClose={vi.fn()}
      />,
    );

    await user.selectOptions(
      screen.getByLabelText("Target Trip Plan"),
      "plan-rain",
    );
    await user.selectOptions(screen.getByLabelText("Scope"), "day");
    await user.clear(screen.getByLabelText("Target day"));
    await user.type(screen.getByLabelText("Target day"), "2026-06-20");
    await user.click(screen.getByRole("button", { name: "Import itinerary" }));

    expect(onApply).toHaveBeenCalledWith({
      day: "2026-06-20",
      memberId: "member-aom",
      mode: "replace-target",
      pathId: "path-rain",
      pathName: "Rain Route",
      recordMode: "clone-linked",
      scope: "day",
      tripPlanId: "plan-rain",
    });
  });
});
