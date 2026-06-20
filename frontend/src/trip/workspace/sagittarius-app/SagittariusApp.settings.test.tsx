import {
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  SagittariusApp,
} from "@/src/app/SagittariusApp";
import {
  appRoutes,
} from "@/src/trip/workspace/sagittarius-app/support";
import {
  apiSeedTrip,
  createApiClientForTrip,
  installLocalStorageStub,
  installSessionStorageStub,
  persistTripParticipantSession,
  render,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit settings", () => {
  beforeEach(() => {
    installLocalStorageStub();
    installSessionStorageStub();
    window.history.pushState(null, "", appRoutes.home());
  });

  it("patches trip countries when organizer changes the API trip destination", async () => {
    const user = userEvent.setup();
    installLocalStorageStub();
    const apiTrip = apiSeedTrip();
    persistTripParticipantSession(window.localStorage, {
      tripId: apiTrip.id,
      memberId: apiTrip.members[0].id,
      sessionToken: "settings-session-token",
    });
    const patchTrip = vi.fn().mockResolvedValue({
      ...apiTrip,
      destinationLabel: "Chiang Mai, Thailand",
      countries: ["Thailand"],
      version: 2,
    });
    const apiClient = createApiClientForTrip(apiTrip, { patchTrip });

    render(
      <SagittariusApp
        requireJoin
        dataSource="api"
        initialView="settings"
        apiClient={apiClient}
      />,
    );

    const destinationInput = await screen.findByLabelText("ปลายทาง");
    await user.clear(destinationInput);
    await user.type(destinationInput, "Chiang Mai, Thailand");
    await user.click(
      screen.getByRole("button", {
        name: /Save changes|บันทึกการเปลี่ยนแปลง/i,
      }),
    );

    await waitFor(() =>
      expect(patchTrip).toHaveBeenCalledWith(
        apiTrip.id,
        "settings-session-token",
        expect.objectContaining({
          destinationLabel: "Chiang Mai, Thailand",
          countries: ["Thailand"],
        }),
      ),
    );
  });
});
