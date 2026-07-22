/**
 * @vitest-environment happy-dom
 *
 * DayStopDetails — inline notes/status inspector (M80VKAX5 T5 #1).
 * Landmarks from day-workspace-theme-a-draft-v9.html:
 *   <section aria-label="Selected details"> <h2>Details</h2>
 *   Notes textarea + Status — not a dialog (destructive/must-finish may still use dialogs).
 * DOM: bunfig.toml preloads test/happy-dom-setup.ts for RTL under bun test.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { DayStopDetails } from "./DayStopDetails";

/** Independent draft literals (Wat Chedi Details panel). */
const STOP_ID = "item-wat-chedi";
const STOP_TITLE = "Wat Chedi Luang";
const NOTES_BODY = "Meet at east gate. Soft shoes for temple grounds.";
const STATUS_VALUE = "booked";
const PATCHED_NOTES = "Bring water bottle";
const PATCHED_STATUS = "planned";

const DETAILS_REGION = /Selected details/i;
const DETAILS_HEADING = /^Details$/i;
const NOTES_LABEL = /^Notes$/i;
const STATUS_LABEL = /^Status$/i;

const API_BASE = "http://127.0.0.1:5181";
const TRIP_ID = "018f4e80-5788-7de0-a45c-8a555d17fc2d";
const SESSION_TOKEN = "member-session-token-day-stop-details";
const EXPECTED_VERSION = 4;

type FetchCall = {
  url: string;
  init: RequestInit;
  body: Record<string, unknown>;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function itineraryPatchCalls(fetchMock: ReturnType<typeof vi.fn>): FetchCall[] {
  return fetchMock.mock.calls
    .map(([input, init]) => {
      const url = String(input);
      const method = (init?.method ?? "GET").toUpperCase();
      if (method !== "PATCH" || !url.includes("/itinerary-items/")) return null;
      if (url.includes("/itinerary-items/order")) return null;
      let body: Record<string, unknown> = {};
      try {
        body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      } catch {
        body = {};
      }
      return { url, init: init ?? {}, body };
    })
    .filter((call): call is FetchCall => call !== null);
}

afterEach(() => {
  cleanup();
});

/**
 * T5 #1: Selected stop shows inline Details for notes/status (not a dialog);
 * destructive/must-finish may still use dialogs.
 */
describe("DayStopDetails inline notes/status", () => {
  it("selected stop shows inline Notes and Status (not a dialog); blur commits via itinerary-items PATCH", async () => {
    const fetchMock = vi.fn(async (input, init) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (method === "PATCH" && url.includes(`/itinerary-items/${STOP_ID}`)) {
        return jsonResponse({
          id: STOP_ID,
          tripId: TRIP_ID,
          planVariantId: "plan-1",
          day: "2026-04-12",
          activity: STOP_TITLE,
          activityType: "attraction",
          place: "Old City",
          startTime: "09:00",
          status: PATCHED_STATUS,
          version: EXPECTED_VERSION + 1,
        });
      }
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    });

    render(
      <DayStopDetails
        stop={{
          id: STOP_ID,
          activity: STOP_TITLE,
          note: NOTES_BODY,
          status: STATUS_VALUE,
          version: EXPECTED_VERSION,
        }}
        tripId={TRIP_ID}
        sessionToken={SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
      />,
    );

    // Inline panel (draft aria-label="Selected details") — not a dialog shell.
    const panel = screen.getByRole("region", { name: DETAILS_REGION });
    expect(
      within(panel).getByRole("heading", { name: DETAILS_HEADING }),
    ).toBeInTheDocument();
    expect(panel.closest("[role='dialog']")).toBeNull();
    expect(
      screen.queryByRole("dialog", { name: DETAILS_HEADING }),
    ).not.toBeInTheDocument();

    const notes = within(panel).getByLabelText(NOTES_LABEL);
    const status = within(panel).getByLabelText(STATUS_LABEL);
    expect(notes).toBeVisible();
    expect(status).toBeVisible();
    expect(notes).toHaveValue(NOTES_BODY);
    expect(status).toHaveValue(STATUS_VALUE);
    // Notes/Status live in the inline region — not wrapped by a dialog.
    expect(notes.closest("[role='dialog']")).toBeNull();
    expect(status.closest("[role='dialog']")).toBeNull();

    // --- Notes blur → PATCH note via existing itinerary-api ---
    fireEvent.change(notes, { target: { value: PATCHED_NOTES } });
    fireEvent.blur(notes);
    await waitFor(() => {
      expect(itineraryPatchCalls(fetchMock)).toHaveLength(1);
    });
    const notePatch = itineraryPatchCalls(fetchMock)[0]!;
    expect(notePatch.url).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/${STOP_ID}`,
    );
    expect((notePatch.init.method ?? "").toUpperCase()).toBe("PATCH");
    expect(new Headers(notePatch.init.headers).get("Authorization")).toBe(
      `Bearer ${SESSION_TOKEN}`,
    );
    expect(typeof notePatch.body.clientMutationId).toBe("string");
    expect(String(notePatch.body.clientMutationId).length).toBeGreaterThan(0);
    expect(notePatch.body.expectedVersion).toBe(EXPECTED_VERSION);
    expect(notePatch.body.patch).toEqual(
      expect.objectContaining({ note: PATCHED_NOTES }),
    );

    // --- Status commit → PATCH status on the same route ---
    fetchMock.mockClear();
    fireEvent.change(status, { target: { value: PATCHED_STATUS } });
    fireEvent.blur(status);
    await waitFor(() => {
      expect(itineraryPatchCalls(fetchMock)).toHaveLength(1);
    });
    const statusPatch = itineraryPatchCalls(fetchMock)[0]!;
    expect(statusPatch.url).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/${STOP_ID}`,
    );
    expect(statusPatch.body.expectedVersion).toBe(EXPECTED_VERSION);
    expect(statusPatch.body.patch).toEqual(
      expect.objectContaining({ status: PATCHED_STATUS }),
    );
    // Still the existing itinerary-items path — no parallel details API.
    expect(statusPatch.url).not.toMatch(/\/day-details\b|\/stop-notes\b/);
  });
});
