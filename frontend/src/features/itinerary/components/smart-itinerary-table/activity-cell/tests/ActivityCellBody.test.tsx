import { render, screen } from "@testing-library/react";
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
  it("renders the item note between the location line and the meta area", () => {
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

    expect(screen.getByText("Bring sunscreen and water")).toBeInTheDocument();
  });

  it("does not render a note line when item.note is empty", () => {
    render(
      <ActivityCellBody
        {...baseProps}
        item={buildItineraryItem({
          activity: "Beach time",
          activityType: "attraction",
          note: "",
        })}
      />,
    );

    expect(
      screen.queryByText("Bring sunscreen and water"),
    ).not.toBeInTheDocument();
  });
});
