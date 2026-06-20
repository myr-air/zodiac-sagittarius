import {
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import {
  SagittariusApp,
} from "@/src/app/SagittariusApp";
import { tripParticipantSessionStorageKey } from "@/src/trip/auth";
import { seedTrip } from "@/src/trip/seed";
import {
  createApiClientForTrip,
  installLocalStorageStub,
  openItineraryHeaderControls,
  persistTripParticipantSession,
  render,
  resetSagittariusAppTestEnvironment,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit UI", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  it("opens an empty trip timeline without a selected itinerary item", async () => {
    installLocalStorageStub();
    const emptyTrip = {
      ...seedTrip,
      id: "019e83ac-ed69-7df3-9354-b27359800374",
      itineraryItems: [],
      members: [
        {
          ...seedTrip.members[0],
          tripId: "019e83ac-ed69-7df3-9354-b27359800374",
        },
      ],
    };
    persistTripParticipantSession(window.sessionStorage, {
      tripId: emptyTrip.id,
      memberId: emptyTrip.members[0].id,
      sessionToken: "empty-trip-session",
    });

    render(
      <SagittariusApp
        accessMode="trip-access"
        initialView="timeline"
        requireJoin
        dataSource="api"
        routeTripId={emptyTrip.id}
        apiClient={createApiClientForTrip(emptyTrip)}
      />,
    );

    expect(
      await screen.findByRole("region", { name: /ไทม์ไลน์ทริป/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ไทม์ไลน์/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });


  it("starts hydration from the join gate even when a remembered participant session exists", async () => {
    installLocalStorageStub();
    persistTripParticipantSession(window.localStorage, {
      memberId: "member-aom",
      sessionToken: "local_hydration_test",
      createdAt: "2026-05-28T00:00:00.000Z",
    });

    render(<SagittariusApp initialView="members" requireJoin />);

    expect(
      screen.getByRole("main", { name: /Account access/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: /เมนูวางแผน Joii/i }),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByRole("navigation", { name: /เมนูวางแผน Joii/i }),
    ).toBeInTheDocument();
  });

  it("cleans corrupt persisted drafts and participant sessions before opening", async () => {
    const storage = installLocalStorageStub();
    storage.setItem("sagittarius:trip-draft", "{");
    storage.setItem(tripParticipantSessionStorageKey, "{");

    render(<SagittariusApp requireJoin />);

    await waitFor(() => {
      expect(storage.getItem("sagittarius:trip-draft")).toBeNull();
      expect(storage.getItem(tripParticipantSessionStorageKey)).toBeNull();
    });
    expect(
      screen.getByRole("main", { name: /Account access/i }),
    ).toBeInTheDocument();
  });


  it("changes edit affordances by role capability", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    expect(screen.queryByRole("button", { name: /นำเข้า|Import/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /ส่งออก|Export/i })).toBeNull();
    await openItineraryHeaderControls(user);
    expect(screen.getByRole("button", { name: "เพิ่มแผน" })).toBeEnabled();

    await user.selectOptions(
      screen.getByLabelText(/Role preview/i),
      "member-viewer",
    );

    expect(screen.queryByRole("button", { name: /นำเข้า|Import/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /ส่งออก|Export/i })).toBeNull();
    expect(screen.queryByRole("button", { name: "เพิ่มแผน" })).toBeNull();
    expect(
      screen.getByText(/ต้องมีสิทธิ์ผู้จัดทริปจึงจะแก้ไขได้/i),
    ).toBeInTheDocument();
  });

});
