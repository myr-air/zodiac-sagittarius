import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { getMessages } from "@/src/i18n/messages";
import { buildItineraryItem } from "@/src/features/itinerary/testing";
import { ActivityCellBody } from "../ActivityCellBody";

const itineraryLabels = getMessages("en").itinerary;

const baseProps = {
  actionMenuLabel: "Activity actions",
  actionsExpanded: false,
  bookingDocs: [],
  bookingLinkItems: [],
  editable: false,
  itineraryLabels,
  locale: "en" as const,
  onAddBookingForItem: undefined,
  onAddNoteForItem: vi.fn(),
  onCloseCompactActions: vi.fn(),
  onDeleteItem: vi.fn(),
  onEditItem: vi.fn(),
  onOpenItemDetails: vi.fn(),
  onOpenNoteForItem: vi.fn(),
  onOpenSubActivityModal: vi.fn(),
  onSaveBookingForItem: undefined,
  onToggleActions: vi.fn(),
  onToggleSubActivities: vi.fn(),
  onUnlinkBookingForItem: undefined,
  onUpdateItemInline: vi.fn(),
  showSubActivityToggle: false,
  status: null,
  subActivitiesExpanded: false,
};

describe("ActivityCellBody", () => {
  it("renders the item note inside the expandable details section", async () => {
    const user = userEvent.setup();
    render(
      <ActivityCellBody
        {...baseProps}
        item={buildItineraryItem({
          activity: "Beach time",
          activityType: "attraction",
          note: "Bring sunscreen and water",
        })}
      />,
    );

    const toggle = screen.getByRole("button", {
      name: /^Show details for Beach time$/i,
    });
    await user.click(toggle);
    expect(screen.getByText("Bring sunscreen and water")).toBeInTheDocument();
  });

  it("does not render the expandable toggle when item has no note or transport", () => {
    render(
      <ActivityCellBody
        {...baseProps}
        item={buildItineraryItem({
          activity: "Beach time",
          activityType: "attraction",
          note: "",
          transportation: "",
        })}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /^Show details for Beach time$/i }),
    ).not.toBeInTheDocument();
  });

  it("renders the details toggle when transport is present on a non-travel item", () => {
    render(
      <ActivityCellBody
        {...baseProps}
        item={buildItineraryItem({
          activity: "Airport hop",
          activityType: "attraction",
          note: "",
          transportation: "Bus",
        })}
      />,
    );

    expect(
      screen.getByRole("button", { name: /^Show details for Airport hop$/i }),
    ).toBeInTheDocument();
  });
});
