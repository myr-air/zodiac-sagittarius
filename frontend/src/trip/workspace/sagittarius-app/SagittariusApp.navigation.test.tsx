import {
  act,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import { tripParticipantSessionStorageKey } from "@/src/trip/auth";
import { seedTrip } from "@/src/trip/seed";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import {
  createApiClientForTrip,
  installLocalStorageStub,
  installSessionStorageStub,
  render,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit navigation", () => {
  beforeEach(() => {
    installLocalStorageStub();
    installSessionStorageStub();
    window.history.pushState(null, "", appRoutes.home());
  });

  it("switches trip workspace navigation without reloading the backend cockpit", async () => {
    const user = userEvent.setup();
    installLocalStorageStub();
    window.sessionStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: seedTrip.id,
        memberId: seedTrip.members[0].id,
        sessionToken: "persisted-trip-session",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );
    window.history.pushState(null, "", appRoutes.tripOverview(seedTrip.id));
    const apiClient = createApiClientForTrip(seedTrip);

    render(
      <SagittariusApp
        accessMode="trip-access"
        requireJoin
        dataSource="api"
        routeTripId={seedTrip.id}
        apiClient={apiClient}
      />,
    );

    await waitFor(() => expect(apiClient.loadTrip).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole("link", { name: /แผนการเดินทาง/i }));

    expect(window.location.pathname).toBe(appRoutes.tripItinerary(seedTrip.id));
    expect(
      screen.getByRole("link", { name: /แผนการเดินทาง/i }),
    ).toHaveAttribute("aria-current", "page");
    expect(apiClient.loadTrip).toHaveBeenCalledTimes(1);
  });

  it("re-syncs workspace active link from popstate without extra loadTrip", async () => {
    installLocalStorageStub();
    window.sessionStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: seedTrip.id,
        memberId: seedTrip.members[0].id,
        sessionToken: "persisted-trip-session",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );
    window.history.pushState(null, "", appRoutes.tripOverview(seedTrip.id));
    const apiClient = createApiClientForTrip(seedTrip);

    render(
      <SagittariusApp
        accessMode="trip-access"
        requireJoin
        dataSource="api"
        routeTripId={seedTrip.id}
        apiClient={apiClient}
      />,
    );

    await waitFor(() => expect(apiClient.loadTrip).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("link", { name: /ภาพรวม/i })).toHaveAttribute(
      "aria-current",
      "page",
    );

    act(() => {
      window.history.pushState(null, "", appRoutes.tripItinerary(seedTrip.id));
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await waitFor(() =>
      expect(
        screen.getByRole("link", { name: /แผนการเดินทาง/i }),
      ).toHaveAttribute("aria-current", "page"),
    );
    expect(screen.getByRole("link", { name: /ภาพรวม/i })).not.toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(apiClient.loadTrip).toHaveBeenCalledTimes(1);
  });


  it("keeps the left navigation simple and only links to implemented views", () => {
    render(<SagittariusApp />);

    const navigation = screen.getByRole("navigation", {
      name: /เมนูวางแผน Joii/i,
    });
    const railLinks = navigation.querySelector(".rail-links");
    expect(railLinks).not.toBeNull();
    const links = within(railLinks as HTMLElement).getAllByRole("link");

    expect(links.map((link) => link.textContent?.trim())).toEqual([
      "ภาพรวม",
      "แผนการเดินทาง",
      "แผนที่",
      "ไทม์ไลน์",
      "ตั๋วและเอกสาร",
      "รูปภาพ",
      "สมาชิก",
      "ค่าใช้จ่าย",
      "ตั้งค่า",
    ]);
    expect(
      within(navigation).getByRole("link", { name: /ภาพรวม/i }),
    ).toHaveClass("rail-link--active");
    expect(
      within(navigation).queryByRole("link", { name: /งบประมาณ/i }),
    ).not.toBeInTheDocument();
    expect(
      within(navigation).getByRole("link", { name: /ตั๋วและเอกสาร/i }),
    ).toBeInTheDocument();
    expect(
      within(navigation).getByRole("link", { name: /รูปภาพ/i }),
    ).toBeInTheDocument();
    expect(
      within(navigation).getByRole("link", { name: /^ตั้งค่า$/ }),
    ).toBeInTheDocument();
  });


  it("can start on real route paths with the right surface first", () => {
    const { rerender } = render(<SagittariusApp initialView="map" />);

    const navigation = screen.getByRole("navigation", {
      name: /เมนูวางแผน Joii/i,
    });
    expect(
      within(navigation).getByRole("link", { name: /แผนที่/i }),
    ).toHaveClass("rail-link--active");
    expect(
      document.querySelector(".planning-main")?.firstElementChild,
    ).toHaveClass("route-map-panel");
    expect(
      screen.queryByRole("region", { name: /ตารางแผนการเดินทาง/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /ไทม์ไลน์ทริป/i }),
    ).not.toBeInTheDocument();

    rerender(<SagittariusApp initialView="timeline" />);

    expect(
      within(navigation).getByRole("link", { name: /ไทม์ไลน์/i }),
    ).toHaveClass("rail-link--active");
    expect(
      document.querySelector(".planning-main")?.firstElementChild,
    ).toHaveClass("timeline-panel");
    expect(
      screen.queryByRole("region", { name: /ตารางแผนการเดินทาง/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /แผนที่เส้นทาง/i }),
    ).not.toBeInTheDocument();
  });


  it("collapses the left rail and keeps labels accessible", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(screen.getByRole("button", { name: /ย่อเมนู/i }));

    const nav = screen.getByRole("navigation", { name: /เมนูวางแผน Joii/i });
    expect(nav).toHaveAttribute("data-collapsed", "true");
    expect(screen.getByRole("button", { name: /ขยายเมนู/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    await user.click(screen.getByRole("button", { name: /ขยายเมนู/i }));

    expect(nav).toHaveAttribute("data-collapsed", "false");
    expect(screen.getByRole("button", { name: /ย่อเมนู/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  }, 45_000);

});
