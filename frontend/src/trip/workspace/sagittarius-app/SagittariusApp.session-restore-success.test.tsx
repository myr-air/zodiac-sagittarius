import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import { seedTrip } from "@/src/trip/seed";
import {
  createApiClientForTrip,
  installLocalStorageStub,
  persistTripParticipantSession,
  render,
  resetSagittariusAppTestEnvironment,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit session restore success", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  it("hydrates a persisted API session before the backend trip is in local state", async () => {
    installLocalStorageStub();
    const apiTrip = {
      ...seedTrip,
      id: "018fc9c4-9cf0-7384-93ee-9bdc9c8d8f11",
      name: "Account Created API Trip",
      joinId: "ACCOUNT-CREATED",
      joinPasswordHash: "",
      members: [
        {
          ...seedTrip.members[0],
          id: "018fc9c4-9cf0-7384-93ee-9bdc9c8d8f22",
          tripId: "018fc9c4-9cf0-7384-93ee-9bdc9c8d8f11",
          displayName: "Account Owner",
          claimPasswordHash: null,
        },
      ],
    };
    persistTripParticipantSession(window.sessionStorage, {
      tripId: apiTrip.id,
      memberId: apiTrip.members[0].id,
      sessionToken: "account-created-session-token",
    });
    const apiClient = createApiClientForTrip(apiTrip);

    render(
      <SagittariusApp
        requireJoin
        dataSource="api"
        initialView="members"
        apiClient={apiClient}
      />,
    );

    await waitFor(() =>
      expect(apiClient.loadTrip).toHaveBeenCalledWith(
        apiTrip.id,
        "account-created-session-token",
      ),
    );
    expect(
      await screen.findByRole("heading", { name: /Account Created API Trip/i }),
    ).toBeInTheDocument();
  });
});
