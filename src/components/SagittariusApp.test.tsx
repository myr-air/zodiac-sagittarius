import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";

describe("Sagittarius cockpit UI", () => {
  it("opens directly into the planning cockpit instead of a marketing landing page", () => {
    render(<SagittariusApp />);

    expect(screen.getByRole("heading", { name: /Hong Kong \+ Shenzhen planning cockpit/i })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /Sagittarius planning navigation/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Smart itinerary table/i })).toBeInTheDocument();
    expect(screen.queryByText(/hero/i)).not.toBeInTheDocument();
  });

  it("collapses the left rail and keeps labels accessible", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp />);

    await user.click(screen.getByRole("button", { name: /Collapse navigation/i }));

    const nav = screen.getByRole("navigation", { name: /Sagittarius planning navigation/i });
    expect(nav).toHaveAttribute("data-collapsed", "true");
    expect(screen.getByRole("button", { name: /Expand navigation/i })).toHaveAttribute("aria-expanded", "false");
  });

  it("uses selected table row to drive the right context rail", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp />);

    await user.click(screen.getByRole("button", { name: /Select stop Avenue of Stars walk/i }));

    const context = screen.getByRole("complementary", { name: /Planning context/i });
    expect(within(context).getByRole("heading", { name: /Avenue of Stars walk/i })).toBeInTheDocument();
    expect(within(context).getByText(/Tsim Sha Tsui promenade/i)).toBeInTheDocument();
  });

  it("changes edit affordances by role capability", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp />);

    expect(screen.getByRole("button", { name: /Add stop/i })).toBeEnabled();

    await user.selectOptions(screen.getByLabelText(/Role preview/i), "member-viewer");

    expect(screen.getByRole("button", { name: /Add stop/i })).toBeDisabled();
    expect(screen.getByText(/editing requires organizer access/i)).toBeInTheDocument();
  });
});
