/**
 * @vitest-environment happy-dom
 *
 * PlaceResolveDialog — candidate picker → PATCH place/mapLink/lat/lng (M81HY2YR T2 #1).
 * Landmarks from places-bulk-ingest-draft-v1.html #dlg-resolve:
 *   role="dialog" aria-labelledby → "Resolve place"
 *   step-label Candidates; .candidate buttons (aria-pressed); Apply to stop
 * Pick → patchItineraryItem({ place, mapLink, latitude, longitude }, expectedVersion);
 * onApplied receives returned summary so the next edit can use the new version.
 * DOM: bunfig.toml preloads test/happy-dom-setup.ts for RTL under bun test.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { resolvePlace } from "../../src/trip/place-resolve-api";
import { patchItineraryItem } from "../../src/trip/itinerary-api";
import type { TripCockpitItineraryItem } from "../../src/trip/trip-cockpit-load";
import { PlaceResolveDialog } from "./PlaceResolveDialog";

vi.mock("../../src/trip/place-resolve-api", () => ({
  resolvePlace: vi.fn(),
}));

vi.mock("../../src/trip/itinerary-api", () => ({
  patchItineraryItem: vi.fn(),
}));

const resolvePlaceMock = vi.mocked(resolvePlace);
const patchItineraryItemMock = vi.mocked(patchItineraryItem);

/** Independent draft / API literals (Ichiran resolve round-trip). */
const API_BASE = "http://127.0.0.1:5181";
const TRIP_ID = "018f4e80-5788-7de0-a45c-8a555d17fc2d";
const SESSION_TOKEN = "member-session-token-place-resolve-dialog";
const ITEM_ID = "item-ichiran-resolve";
const ACTIVITY = "Ichiran dinner";
const PLACE_HINT = "Ichiran Shinjuku";
const DAY = "2026-04-10";
const DESTINATION_LABEL = "Tokyo";
const COUNTRIES = ["JP"] as const;
const EXPECTED_VERSION = 7;
const RETURNED_VERSION = EXPECTED_VERSION + 1;

const DIALOG_TITLE = "Resolve place";
const CANDIDATES_LABEL = /candidates/i;
const APPLY_LABEL = /^Apply to stop$/i;
const CANCEL_LABEL = /^Cancel$/i;

const CANDIDATE_A = {
  name: "Ichiran Shinjuku Central Rd",
  address: "1-22-7 Kabukicho, Shinjuku City, Tokyo",
  coordinates: { lat: 35.694, lng: 139.7028 },
  mapLink: "https://www.openstreetmap.org/?mlat=35.694&mlon=139.7028#map=17/35.694/139.7028",
  confidence: 0.94,
  source: "nominatim",
  evidence: ["brave: Ichiran Shinjuku"],
} as const;

const CANDIDATE_B = {
  name: "Ichiran Shibuya",
  address: "Shibuya · less likely for this day",
  coordinates: { lat: 35.6595, lng: 139.7004 },
  mapLink: "https://www.openstreetmap.org/?mlat=35.6595&mlon=139.7004#map=17/35.6595/139.7004",
  confidence: 0.41,
  source: "nominatim",
  evidence: ["brave: Ichiran Shibuya"],
} as const;

const RETURNED_ITEM: TripCockpitItineraryItem = {
  id: ITEM_ID,
  tripId: TRIP_ID,
  planVariantId: "plan-1",
  day: DAY,
  activity: ACTIVITY,
  activityType: "food",
  place: CANDIDATE_B.name,
  startTime: "19:00",
  endTime: "20:30",
  status: "idea",
  version: RETURNED_VERSION,
  mapLink: CANDIDATE_B.mapLink,
  coordinates: {
    lat: CANDIDATE_B.coordinates.lat,
    lng: CANDIDATE_B.coordinates.lng,
  },
};

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  resolvePlaceMock.mockReset();
  patchItineraryItemMock.mockReset();
});

/**
 * T2 #1 (dialog): Explicit resolve opens candidate picker; picking a candidate
 * PATCHes place + mapLink + latitude/longitude via expectedVersion and surfaces
 * the returned summary (version) for the next edit.
 */
describe("PlaceResolveDialog pick → PATCH place/mapLink/coords", () => {
  it("opens Candidates per draft; Apply to stop PATCHes place, mapLink, latitude/longitude with expectedVersion and onApplied gets returned version", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn<() => void>();
    const onApplied = vi.fn<(item: TripCockpitItineraryItem) => void>();

    resolvePlaceMock.mockResolvedValue({
      ok: true,
      status: "resolved",
      candidates: [CANDIDATE_A, CANDIDATE_B],
    });
    patchItineraryItemMock.mockResolvedValue({
      ok: true,
      item: RETURNED_ITEM,
    });

    render(
      <PlaceResolveDialog
        open
        item={{
          id: ITEM_ID,
          activity: ACTIVITY,
          place: PLACE_HINT,
          day: DAY,
          version: EXPECTED_VERSION,
        }}
        tripId={TRIP_ID}
        sessionToken={SESSION_TOKEN}
        destinationLabel={DESTINATION_LABEL}
        countries={[...COUNTRIES]}
        apiBaseUrl={API_BASE}
        onClose={onClose}
        onApplied={onApplied}
      />,
    );

    await waitFor(() => {
      expect(resolvePlaceMock).toHaveBeenCalled();
    });
    expect(resolvePlaceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tripId: TRIP_ID,
        sessionToken: SESSION_TOKEN,
        activity: ACTIVITY,
        placeHint: PLACE_HINT,
        destinationLabel: DESTINATION_LABEL,
        countries: [...COUNTRIES],
        day: DAY,
      }),
      expect.anything(),
    );
    expect(typeof resolvePlaceMock.mock.calls[0]![0].clientMutationId).toBe(
      "string",
    );
    expect(
      String(resolvePlaceMock.mock.calls[0]![0].clientMutationId).length,
    ).toBeGreaterThan(0);

    const dialog = await screen.findByRole("dialog", { name: DIALOG_TITLE });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(within(dialog).getByText(CANDIDATES_LABEL)).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: CANCEL_LABEL }),
    ).toBeInTheDocument();

    const candidateA = within(dialog).getByRole("button", {
      name: new RegExp(CANDIDATE_A.name, "i"),
    });
    const candidateB = within(dialog).getByRole("button", {
      name: new RegExp(CANDIDATE_B.name, "i"),
    });
    expect(candidateA).toBeInTheDocument();
    expect(candidateB).toBeInTheDocument();

    // Draft: select a candidate (aria-pressed), then Apply to stop.
    await user.click(candidateB);
    expect(candidateB).toHaveAttribute("aria-pressed", "true");
    expect(candidateA).toHaveAttribute("aria-pressed", "false");

    await user.click(within(dialog).getByRole("button", { name: APPLY_LABEL }));

    await waitFor(() => {
      expect(patchItineraryItemMock).toHaveBeenCalledTimes(1);
    });
    expect(patchItineraryItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tripId: TRIP_ID,
        itemId: ITEM_ID,
        sessionToken: SESSION_TOKEN,
        expectedVersion: EXPECTED_VERSION,
        patch: {
          place: CANDIDATE_B.name,
          mapLink: CANDIDATE_B.mapLink,
          latitude: CANDIDATE_B.coordinates.lat,
          longitude: CANDIDATE_B.coordinates.lng,
        },
      }),
      expect.anything(),
    );

    await waitFor(() => {
      expect(onApplied).toHaveBeenCalledWith(
        expect.objectContaining({
          id: ITEM_ID,
          version: RETURNED_VERSION,
          place: CANDIDATE_B.name,
          mapLink: CANDIDATE_B.mapLink,
        }),
      );
    });
    expect(onClose).toHaveBeenCalled();
  });
});

/**
 * T2 #2 — Honest resolve failures: status unresolved / empty candidates or
 * resolve API failure surfaces calm product error (draft #resolve-error; no
 * fake Apply success). PATCH version_conflict still reloads the cockpit.
 * Independent calm copy from places-bulk-ingest-draft-v1.html #resolve-error.
 */
const UNRESOLVED_CALM_ERROR =
  "Place resolve is unavailable right now. You can still paste a map link.";
const RESOLVE_API_FAILURE_ERROR =
  "Could not resolve this place. Please try again.";
const CONFLICT_CODE = "version_conflict";
const CONFLICT_PATCH_ERROR =
  "This stop changed elsewhere. Reloading the latest plan…";

function renderResolveDialog(opts: {
  onClose?: ReturnType<typeof vi.fn<() => void>>;
  onApplied?: ReturnType<
    typeof vi.fn<(item: TripCockpitItineraryItem) => void>
  >;
  onCockpitReload?: ReturnType<typeof vi.fn<() => void>>;
}) {
  return render(
    <PlaceResolveDialog
      open
      item={{
        id: ITEM_ID,
        activity: ACTIVITY,
        place: PLACE_HINT,
        day: DAY,
        version: EXPECTED_VERSION,
      }}
      tripId={TRIP_ID}
      sessionToken={SESSION_TOKEN}
      destinationLabel={DESTINATION_LABEL}
      countries={[...COUNTRIES]}
      apiBaseUrl={API_BASE}
      onClose={opts.onClose ?? vi.fn<() => void>()}
      onApplied={opts.onApplied}
      onCockpitReload={opts.onCockpitReload}
    />,
  );
}

describe("PlaceResolveDialog unresolved / resolve failure / version_conflict", () => {
  it("status unresolved / empty candidates or resolve API failure shows calm product error (no fake success); version_conflict still reloads cockpit", async () => {
    const user = userEvent.setup();

    // --- Unresolved / empty candidates: calm error-box, no Apply success ---
    const onAppliedEmpty = vi.fn<(item: TripCockpitItineraryItem) => void>();
    resolvePlaceMock.mockResolvedValue({
      ok: true,
      status: "unresolved",
      candidates: [],
    });

    renderResolveDialog({ onApplied: onAppliedEmpty });

    const emptyDialog = await screen.findByRole("dialog", {
      name: DIALOG_TITLE,
    });
    const emptyAlert = await within(emptyDialog).findByRole("alert");
    expect(emptyAlert).toHaveTextContent(UNRESOLVED_CALM_ERROR);
    expect(
      within(emptyDialog).queryByRole("button", {
        name: new RegExp(CANDIDATE_A.name, "i"),
      }),
    ).not.toBeInTheDocument();
    expect(
      within(emptyDialog).getByRole("button", { name: APPLY_LABEL }),
    ).toBeDisabled();
    expect(onAppliedEmpty).not.toHaveBeenCalled();
    expect(patchItineraryItemMock).not.toHaveBeenCalled();

    cleanup();

    // --- Resolve API failure: calm product error, no fake success ---
    const onAppliedFail = vi.fn<(item: TripCockpitItineraryItem) => void>();
    resolvePlaceMock.mockResolvedValue({
      ok: false,
      error: RESOLVE_API_FAILURE_ERROR,
    });

    renderResolveDialog({ onApplied: onAppliedFail });

    const failDialog = await screen.findByRole("dialog", {
      name: DIALOG_TITLE,
    });
    const failAlert = await within(failDialog).findByRole("alert");
    expect(failAlert).toHaveTextContent(RESOLVE_API_FAILURE_ERROR);
    expect(
      within(failDialog).getByRole("button", { name: APPLY_LABEL }),
    ).toBeDisabled();
    expect(onAppliedFail).not.toHaveBeenCalled();
    expect(patchItineraryItemMock).not.toHaveBeenCalled();

    cleanup();

    // --- Apply version_conflict: reload cockpit; no onApplied success ---
    const onAppliedConflict = vi.fn<(item: TripCockpitItineraryItem) => void>();
    const onCockpitReload = vi.fn<() => void>();
    const onCloseConflict = vi.fn<() => void>();
    resolvePlaceMock.mockResolvedValue({
      ok: true,
      status: "resolved",
      candidates: [CANDIDATE_A],
    });
    patchItineraryItemMock.mockResolvedValue({
      ok: false,
      error: CONFLICT_PATCH_ERROR,
      code: CONFLICT_CODE,
    });

    renderResolveDialog({
      onClose: onCloseConflict,
      onApplied: onAppliedConflict,
      onCockpitReload,
    });

    const conflictDialog = await screen.findByRole("dialog", {
      name: DIALOG_TITLE,
    });
    const candidate = await within(conflictDialog).findByRole("button", {
      name: new RegExp(CANDIDATE_A.name, "i"),
    });
    await user.click(candidate);
    await user.click(
      within(conflictDialog).getByRole("button", { name: APPLY_LABEL }),
    );

    await waitFor(() => {
      expect(patchItineraryItemMock).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(onCockpitReload).toHaveBeenCalledTimes(1);
    });
    const conflictAlert = await within(conflictDialog).findByRole("alert");
    expect(conflictAlert).toHaveTextContent(CONFLICT_PATCH_ERROR);
    expect(onAppliedConflict).not.toHaveBeenCalled();
    expect(onCloseConflict).not.toHaveBeenCalled();
  });
});
