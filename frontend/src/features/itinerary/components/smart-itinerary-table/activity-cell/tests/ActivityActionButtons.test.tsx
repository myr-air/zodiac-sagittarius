import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getMessages } from "@/src/i18n/messages";
import { buildItineraryItem } from "@/src/features/itinerary/testing";
import { ActivityActionButtons } from "../ActivityActionButtons";

const enLabels = getMessages("en").itinerary;
const thLabels = getMessages("th").itinerary;

const baseProps = {
  itineraryLabels: enLabels,
  locale: "en" as const,
};

describe("ActivityActionButtons", () => {
  it("renders a block toggle button when onToggleActivityBlock is provided and item is not a block", () => {
    const onToggleActivityBlock = vi.fn();
    render(
      <ActivityActionButtons
        {...baseProps}
        item={buildItineraryItem({
          id: "item-1",
          activity: "Beach time",
          isPlanBlock: false,
        })}
        onToggleActivityBlock={onToggleActivityBlock}
      />,
    );

    expect(
      screen.getByLabelText("Convert Beach time to activity block"),
    ).toBeInTheDocument();
  });

  it("renders an undo block toggle button when item is already a block", () => {
    const onToggleActivityBlock = vi.fn();
    render(
      <ActivityActionButtons
        {...baseProps}
        item={buildItineraryItem({
          id: "item-2",
          activity: "Beach time",
          isPlanBlock: true,
        })}
        onToggleActivityBlock={onToggleActivityBlock}
      />,
    );

    expect(
      screen.getByLabelText("Undo activity block for Beach time"),
    ).toBeInTheDocument();
  });

  it("does not render a block toggle button when onToggleActivityBlock is omitted", () => {
    render(
      <ActivityActionButtons
        {...baseProps}
        item={buildItineraryItem({
          id: "item-3",
          activity: "Beach time",
          isPlanBlock: false,
        })}
      />,
    );

    expect(
      screen.queryByLabelText("Convert Beach time to activity block"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Undo activity block for Beach time"),
    ).not.toBeInTheDocument();
  });

  it("calls onToggleActivityBlock with the item id when the block toggle button is clicked", async () => {
    const onToggleActivityBlock = vi.fn();
    render(
      <ActivityActionButtons
        {...baseProps}
        item={buildItineraryItem({
          id: "item-4",
          activity: "Beach time",
          isPlanBlock: false,
        })}
        onToggleActivityBlock={onToggleActivityBlock}
      />,
    );

    screen.getByLabelText("Convert Beach time to activity block").click();
    expect(onToggleActivityBlock).toHaveBeenCalledWith("item-4");
  });

  it("localizes the block toggle label for Thai", () => {
    const onToggleActivityBlock = vi.fn();
    render(
      <ActivityActionButtons
        itineraryLabels={thLabels}
        locale="th"
        item={buildItineraryItem({
          id: "item-5",
          activity: "เวลาชายหาด",
          isPlanBlock: false,
        })}
        onToggleActivityBlock={onToggleActivityBlock}
      />,
    );

    expect(
      screen.getByLabelText("เปลี่ยน เวลาชายหาด เป็น activity block"),
    ).toBeInTheDocument();
  });
});
