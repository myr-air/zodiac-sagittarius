import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  installLocalStorageStub,
  renderTripBuilder,
  selectDestinationCity,
} from "../testing/account-access-panel-test-utils";

describe("AccountAccessPanel trip builder destinations", () => {
  beforeEach(() => {
    installLocalStorageStub();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("separates destination metadata in the selected cards and draft summary", async () => {
    const user = userEvent.setup();
    renderTripBuilder();

    fireEvent.change(await screen.findByLabelText(/Trip name/i), {
      target: { value: "ทริปกล่องสุ่ม" },
    });
    await selectDestinationCity(user, "Shenzhen", /^Shenzhen, China$/i);
    await selectDestinationCity(user, "Hong Kong", /^Hong Kong, Hong Kong$/i);

    const form = screen.getByRole("form", { name: /Create trip/i });
    expect(form.textContent).not.toContain("ChinaAsia");
    expect(form.textContent).not.toContain("Hong KongAsia");
    expect(screen.getAllByText("Asia/Shanghai").length).toBeGreaterThan(0);
    expect(screen.getAllByText("CNY").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Asia/Hong_Kong").length).toBeGreaterThan(0);
    expect(screen.getAllByText("HKD").length).toBeGreaterThan(0);
  });

  it("uses selected non-Japan destination cities in destination cards", async () => {
    const user = userEvent.setup();
    renderTripBuilder();

    fireEvent.change(await screen.findByLabelText(/Trip name/i), {
      target: { value: "China Spring Food Trip" },
    });
    await selectDestinationCity(user, "Beijing", /^Beijing, China$/i);

    const preview = screen.getByRole("region", { name: /Live trip preview/i });
    expect(within(preview).getAllByText("Beijing").length).toBeGreaterThan(0);
    expect(within(preview).getByText("China")).toBeInTheDocument();
    expect(within(preview).queryByText("Kyoto")).not.toBeInTheDocument();
    expect(within(preview).queryByText("Osaka")).not.toBeInTheDocument();
    expect(screen.getAllByText("China").length).toBeGreaterThan(1);
  });

  it("does not add Osaka or Kyoto as selected destination cards when Tokyo is the chosen city", async () => {
    const user = userEvent.setup();
    renderTripBuilder();

    await selectDestinationCity(user, "Tokyo", /^Tokyo, Japan$/i);
    await user.type(screen.getByLabelText(/Add city or stop/i), "Tokyo");
    await user.click(screen.getByRole("button", { name: /Add city/i }));

    const previewStep = screen.getByRole("region", { name: /Preview step/i });
    expect(within(previewStep).getAllByText("Tokyo").length).toBeGreaterThan(0);
    expect(within(previewStep).queryByText("Osaka")).not.toBeInTheDocument();
    expect(within(previewStep).queryByText("Kyoto")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Inspiration step/i })).not.toBeInTheDocument();
  });

  it("uses city-first destinations, hides inspiration, and previews an origin-to-destination flight", async () => {
    const user = userEvent.setup();
    renderTripBuilder();

    fireEvent.change(await screen.findByLabelText(/Trip name/i), {
      target: { value: "Tokyo Food Run" },
    });
    expect(screen.getByRole("button", { name: /Language and currency/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Origin city/i)).toHaveValue("Bangkok, Thailand");
    await user.type(screen.getByLabelText(/Search destination cities/i), "Tokyo");
    await user.click(screen.getByRole("button", { name: /^Tokyo, Japan$/i }));

    const preview = screen.getByRole("region", { name: /Live trip preview/i });
    expect(within(preview).getAllByText("Bangkok").length).toBeGreaterThan(0);
    expect(within(preview).getAllByText("Tokyo").length).toBeGreaterThan(0);
    expect(
      within(preview).getByLabelText(/Flight route from Bangkok to Tokyo/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Inspiration step/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("list", { name: /Destination inspiration/i })).not.toBeInTheDocument();
  });
});
