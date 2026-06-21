import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderBookingsDocsPage } from "./BookingsDocsPage.test-support";

describe("BookingsDocsPage filters", () => {
  it("browses booking docs by friendly folders instead of table filters", async () => {
    const user = userEvent.setup();
    renderBookingsDocsPage();

    await user.click(screen.getByRole("button", { name: /Stays/i }));
    expect(screen.getByRole("button", { name: /Select Tsim Sha Tsui hotel stay/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Select Bangkok to Hong Kong flight/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Travel docs/i }));
    expect(screen.getByRole("button", { name: /Select Explorer Friend passport/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Select Peak Tram tickets/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Tickets/i }));
    expect(screen.getByRole("button", { name: /Select Peak Tram tickets/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Select Tsim Sha Tsui hotel stay/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Needs action/i }));
    expect(screen.getByRole("button", { name: /Select Explorer Friend passport/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Select Tsim Sha Tsui hotel stay/i })).toBeInTheDocument();
  });

  it("filters the file list by search text, status, and external-link folder", async () => {
    const user = userEvent.setup();
    renderBookingsDocsPage();

    await user.type(screen.getByPlaceholderText("Search bookings, docs, links"), "Joii");
    expect(screen.getByRole("button", { name: /Select Tsim Sha Tsui hotel stay/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Select Bangkok to Hong Kong flight/i })).not.toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("Search bookings, docs, links"));
    await user.type(screen.getByPlaceholderText("Search bookings, docs, links"), "nothing matches this");
    expect(screen.getByText("No matching files").closest("div")?.parentElement).toHaveClass("max-[1199px]:min-w-0", "max-[1199px]:w-full", "max-[767px]:min-h-[220px]");

    await user.clear(screen.getByPlaceholderText("Search bookings, docs, links"));
    await user.click(screen.getByRole("button", { name: "Status: All statuses" }));
    await user.click(screen.getByRole("option", { name: "Confirmed" }));
    expect(screen.getByRole("button", { name: /Select Bangkok to Hong Kong flight/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Select Explorer Friend passport/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Status: Confirmed" }));
    await user.click(screen.getByRole("option", { name: "All statuses" }));
    await user.click(screen.getByRole("button", { name: /Links & files/i }));
    expect(screen.getByRole("button", { name: /Select Bangkok to Hong Kong flight/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Select Peak Tram tickets/i })).toBeInTheDocument();
  });
});
