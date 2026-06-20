import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import { seedTrip } from "@/src/trip/seed";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import {
  createApiClientForTrip,
  installLocalStorageStub,
  installSessionStorageStub,
  persistTrustedAccountSession,
  render,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit account session restore", () => {
  beforeEach(() => {
    installLocalStorageStub();
    installSessionStorageStub();
    window.history.pushState(null, "", appRoutes.home());
  });

  it("renders the same access choice before restoring a persisted account session", () => {
    installLocalStorageStub();
    persistTrustedAccountSession(
      window.sessionStorage,
      "persisted-account-session",
    );

    render(
      <SagittariusApp
        requireJoin
        dataSource="api"
        apiClient={createApiClientForTrip(seedTrip)}
      />,
    );

    expect(screen.getByRole("tab", { name: /^Temp access$/i })).toHaveClass(
      "account-tab--active",
    );
    expect(
      screen.getByRole("heading", { name: /เข้าห้อง trip/i }),
    ).toBeInTheDocument();
  });
});
