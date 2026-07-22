/**
 * @vitest-environment happy-dom
 *
 * DayTimeEditDialog — Edit time must-finish dialog (M80VKAX5 T5 #2).
 * Landmarks from day-workspace-theme-a-draft-v9.html #time-dialog:
 *   role="dialog" aria-labelledby → "Edit time"
 *   Start / End / Duration (readonly) / Timezone; Save → itinerary-api PATCH.
 * Soft: timezone label + editable (auto place/country is soft).
 * DOM: bunfig.toml preloads test/happy-dom-setup.ts for RTL under bun test.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { DayTimeEditDialog } from "./DayTimeEditDialog";

/** Independent draft literals (Wat Chedi Edit time dialog). */
const STOP_ID = "item-wat-chedi";
const STOP_TITLE = "Wat Chedi Luang";
const START_TIME = "09:00";
const END_TIME = "10:30";
/** Draft durLabel(09:00, 10:30) → "1h 30m". */
const DURATION_LABEL = "1h 30m";
const TIMEZONE_IANA = "Asia/Bangkok";
const TIMEZONE_LABEL = "ICT";
const PATCHED_START = "09:15";
const PATCHED_END = "10:45";

const DIALOG_TITLE = "Edit time";
const START_LABEL = /^Start$/i;
const END_LABEL = /^End$/i;
const DURATION_FIELD_LABEL = /^Duration$/i;
const TIMEZONE_FIELD_LABEL = /^Timezone$/i;
const SAVE_LABEL = /^Save$/i;
const CANCEL_LABEL = /^Cancel$/i;

const API_BASE = "http://127.0.0.1:5181";
const TRIP_ID = "018f4e80-5788-7de0-a45c-8a555d17fc2d";
const SESSION_TOKEN = "member-session-token-day-time-edit";
const EXPECTED_VERSION = 5;

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
 * T5 #2 (dialog half): time edit dialog patches start/end via itinerary-api;
 * timezone is shown and editable (auto from place is soft).
 */
describe("DayTimeEditDialog Save via itinerary-api", () => {
  it("Edit time dialog shows Start/End/Duration/Timezone; Save PATCHes startTime+endTime via itinerary-items", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

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
          startTime: PATCHED_START,
          endTime: PATCHED_END,
          status: "idea",
          version: EXPECTED_VERSION + 1,
        });
      }
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    });

    render(
      <DayTimeEditDialog
        open
        stop={{
          id: STOP_ID,
          activity: STOP_TITLE,
          startTime: START_TIME,
          endTime: END_TIME,
          timezone: TIMEZONE_IANA,
          timezoneLabel: TIMEZONE_LABEL,
          version: EXPECTED_VERSION,
        }}
        tripId={TRIP_ID}
        sessionToken={SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
        onClose={onClose}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: DIALOG_TITLE });
    expect(dialog).toHaveAttribute("aria-modal", "true");

    const start = within(dialog).getByLabelText(START_LABEL);
    const end = within(dialog).getByLabelText(END_LABEL);
    const duration = within(dialog).getByLabelText(DURATION_FIELD_LABEL);
    const timezone = within(dialog).getByLabelText(TIMEZONE_FIELD_LABEL);

    expect(start).toHaveValue(START_TIME);
    expect(end).toHaveValue(END_TIME);
    expect(duration).toHaveValue(DURATION_LABEL);
    expect(duration).toHaveAttribute("readonly");
    // Soft: timezone label visible + editable (IANA or abbreviated ICT).
    expect(timezone).toBeEnabled();
    expect(timezone).toHaveDisplayValue(
      new RegExp(`${TIMEZONE_LABEL}|${TIMEZONE_IANA}`, "i"),
    );

    expect(
      within(dialog).getByRole("button", { name: CANCEL_LABEL }),
    ).toBeInTheDocument();

    // Edit start/end then Save → existing itinerary-items PATCH.
    await user.clear(start);
    await user.type(start, PATCHED_START);
    await user.clear(end);
    await user.type(end, PATCHED_END);
    await user.click(within(dialog).getByRole("button", { name: SAVE_LABEL }));

    await waitFor(() => {
      expect(itineraryPatchCalls(fetchMock)).toHaveLength(1);
    });
    const patchCall = itineraryPatchCalls(fetchMock)[0]!;
    expect(patchCall.url).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/${STOP_ID}`,
    );
    expect((patchCall.init.method ?? "").toUpperCase()).toBe("PATCH");
    expect(new Headers(patchCall.init.headers).get("Authorization")).toBe(
      `Bearer ${SESSION_TOKEN}`,
    );
    expect(typeof patchCall.body.clientMutationId).toBe("string");
    expect(String(patchCall.body.clientMutationId).length).toBeGreaterThan(0);
    expect(patchCall.body.expectedVersion).toBe(EXPECTED_VERSION);
    expect(patchCall.body.patch).toEqual(
      expect.objectContaining({
        startTime: PATCHED_START,
        endTime: PATCHED_END,
      }),
    );
    // Existing itinerary-api only — no parallel time API.
    expect(patchCall.url).not.toMatch(/\/time-blocks\b|\/stop-times\b/);
  });
});
