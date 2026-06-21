import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { getTripFixtureMember } from "@/src/trip/trip-fixtures";
import { renderBookingsDocsPage } from "../testing/support/render-bookings-docs-page";

describe("BookingsDocsPage overview", () => {
  it("renders booking folders, a file list, and selected booking inspector", () => {
    renderBookingsDocsPage();

    expect(screen.getByRole("region", { name: "Bookings & Docs" })).toHaveClass("bookings-docs-page", "bg-transparent");
    expect(document.querySelector(".page-header")).toHaveClass("page-header", "bg-(--color-surface)", "max-[1199px]:rounded-none", "max-[767px]:hidden");
    expect(document.querySelector(".booking-docs-header-actions")).toHaveClass("flex", "items-center", "justify-end");
    expect(screen.getByRole("heading", { name: "Bookings & Docs" })).toHaveClass("text-[24px]", "max-[1199px]:text-[21px]");
    expect(screen.getByText("Hong Kong + Shenzhen Trip")).toHaveClass("max-[767px]:hidden");
    expect(screen.queryByText("Demo Traveler")).not.toBeInTheDocument();
    expect(screen.queryByText("Can edit bookings")).not.toBeInTheDocument();
    expect(document.querySelector(".booking-folder-rail")).toHaveClass("shadow-[0_1px_0_rgb(15_23_42_/_0.04)]");
    expect(document.querySelector(".bookings-file-panel")).toHaveClass("shadow-[0_1px_0_rgb(15_23_42_/_0.04)]");
    expect(document.querySelector(".booking-inspector")).toHaveClass("shadow-[0_1px_0_rgb(15_23_42_/_0.04)]");
    expect(document.querySelector(".bookings-docs-page")).toHaveClass("max-[1199px]:px-0", "max-[1199px]:py-0", "max-[767px]:h-[calc(100dvh-48px)]", "max-[767px]:min-h-[calc(100dvh-48px)]", "max-[767px]:grid-rows-[minmax(0,1fr)]", "max-[767px]:overflow-hidden");
    expect(document.querySelector(".bookings-mobile-add-button")).toHaveClass("!hidden", "max-[767px]:!inline-flex", "max-[767px]:right-[60px]");
    expect(document.querySelector(".booking-folder-rail")).toHaveClass("max-[1199px]:grid-cols-7", "max-[1199px]:rounded-none", "max-[1199px]:shadow-none");
    expect(document.querySelector(".bookings-content")).toHaveClass("grid-cols-[192px_minmax(0,1fr)_300px]", "max-[1199px]:grid-cols-1", "max-[1199px]:grid-rows-[auto_minmax(0,1fr)]", "max-[767px]:h-full");
    expect(document.querySelector(".bookings-file-panel")).toHaveClass("max-[1199px]:min-h-[calc(100dvh-180px)]", "max-[1199px]:rounded-none", "max-[767px]:h-full", "max-[767px]:min-h-0", "max-[767px]:border-0");
    expect(document.querySelector(".bookings-file-toolbar")).toHaveClass("max-[1199px]:px-3", "max-[767px]:px-2");
    expect(document.querySelector(".bookings-file-panel > div:nth-child(2)")).toHaveClass("max-[767px]:px-3");
    expect(document.querySelector(".booking-file-list > div:first-child")).toHaveClass("sticky", "top-0", "min-w-[760px]", "max-[1199px]:hidden");
    expect(document.querySelector(".booking-inspector")).toHaveClass("max-[1199px]:!fixed", "max-[1199px]:left-[74px]", "max-[1199px]:pb-[calc(12px+env(safe-area-inset-bottom))]", "max-[1199px]:translate-y-full", "max-[767px]:left-0");
    expect(screen.getByText("Everything saved for this trip · 5 visible items")).toHaveClass("max-[767px]:hidden");
    expect(screen.getByPlaceholderText("Search bookings, docs, links")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Transport/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Transport/i })).toHaveClass("max-[1199px]:grid-cols-1", "max-[1199px]:border-b-2");
    expect(screen.getByRole("button", { name: /Links & files/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Travel docs/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Select Bangkok to Hong Kong flight/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Select Bangkok to Hong Kong flight/i }).closest(".booking-file-row")).toHaveClass("grid", "min-w-[760px]", "max-[1199px]:min-w-0", "max-[1199px]:grid-cols-[minmax(0,1fr)_auto]");
    expect(screen.getByRole("heading", { name: "Bangkok to Hong Kong flight" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Open Airline booking/i })[0]).toHaveAttribute("href", "https://example.com/airline/booking/QR349-HK");
  });

  it("opens the mobile preview as a bottom drawer from the file list", async () => {
    const user = userEvent.setup();
    renderBookingsDocsPage();

    const inspector = document.querySelector(".booking-inspector");
    expect(inspector).toHaveClass("max-[1199px]:translate-y-full");

    await user.click(screen.getByRole("button", { name: /Select Peak Tram tickets/i }));
    expect(inspector).toHaveClass("max-[1199px]:translate-y-0", "max-[1199px]:opacity-100");

    await user.click(screen.getByRole("button", { name: "Close booking preview" }));
    expect(inspector).toHaveClass("max-[1199px]:translate-y-full", "max-[1199px]:opacity-0");
  });

  it("locks sensitive records for viewers while leaving shared rows visible", () => {
    const viewer = getTripFixtureMember("viewer");
    renderBookingsDocsPage({ currentMember: viewer });

    expect(screen.getByRole("button", { name: /Select Bangkok to Hong Kong flight/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Select Explorer Friend passport/i })).not.toBeInTheDocument();
    expect(screen.getAllByText("Locked sensitive record")).toHaveLength(2);
  });
});
